import { Alert, AppState, Image } from 'react-native';
import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  type NavigationAction,
  useNavigation,
  usePreventRemove,
} from '@react-navigation/native';
import {
  type SavedDiaryItem,
  TICKET_DIARY_VERSION,
  type TicketDiaryOrientation,
} from '../../../../features/ticket/types.ts';
import {
  getTicketDiaryData,
  getTicketDiaryDrawingBase64,
  getTicketDiaryPhotoUrls,
  removeTicketDiaryFiles,
  updateTicketDiaryData,
  uploadTicketDiaryDrawing,
  uploadTicketDiaryPhoto,
} from '../../../../features/ticket/ticketDiary.service.ts';
import type { DiaryItem } from './TicketDiaryPage.tsx';
import type { DiaryDrawingCanvasRef } from './DiaryDrawingCanvas.tsx';
import type { PaperType } from './DiaryPaperSelector.tsx';
import { DIARY_STICKER_PACKS } from './diaryStickerPacks.ts';
import { flushPendingDiarySaves } from './flushPendingDiarySaves.ts';
import { useDiaryStore } from './store/useDiaryStore.ts';

const AUTOSAVE_DELAY_MS = 800;
const AUTOSAVE_ERROR_MESSAGE = '변경 내용을 저장하지 못했어요';

interface DiarySaveSnapshot {
  version: number;
  orientation: TicketDiaryOrientation;
  paperType: PaperType;
  items: DiaryItem[];
  drawingIndex: number;
  drawingBase64: string | null;
  drawingRevision: number;
}

interface UseTicketDiaryPersistenceParams {
  ticketId: string;
  drawingCanvasRef: RefObject<DiaryDrawingCanvasRef | null>;
}

async function prepareDiaryItemsForSave(
  ticketId: string,
  currentItems: DiaryItem[],
  uploadedPhotoPathById: Map<string, string>,
): Promise<SavedDiaryItem[]> {
  const savedItems: SavedDiaryItem[] = [];

  for (const item of currentItems) {
    if (item.type === 'photo') {
      let storagePath =
        item.data.storagePath ?? uploadedPhotoPathById.get(item.data.id);

      if (!storagePath) {
        if (!item.data.base64) {
          throw new Error('저장할 다이어리 사진을 찾을 수 없습니다.');
        }

        storagePath = await uploadTicketDiaryPhoto(
          ticketId,
          item.data.id,
          item.data.base64,
        );

        uploadedPhotoPathById.set(item.data.id, storagePath);
      }

      savedItems.push({
        type: 'photo',
        data: {
          id: item.data.id,
          storagePath,
          width: item.data.width,
          height: item.data.height,
          sourceWidth: item.data.sourceWidth,
          sourceHeight: item.data.sourceHeight,
          matrix: item.data.matrix,
        },
      });

      continue;
    }

    if (item.type === 'sticker') {
      savedItems.push({
        type: 'sticker',
        data: {
          id: item.data.id,
          stickerId: item.data.stickerId,
          width: item.data.width,
          height: item.data.height,
          matrix: item.data.matrix,
        },
      });

      continue;
    }

    if (item.data.text.trim().length > 0) {
      savedItems.push({
        type: 'text',
        data: item.data,
      });
    }
  }

  return savedItems;
}

function findDiaryStickerDefinition(stickerId: string) {
  for (const pack of DIARY_STICKER_PACKS) {
    const sticker = pack.stickers.find(item => item.id === stickerId);

    if (sticker) {
      return sticker;
    }
  }

  return null;
}

async function restoreDiaryItems(
  savedItems: SavedDiaryItem[],
): Promise<DiaryItem[]> {
  const photoPaths = savedItems.flatMap(item =>
    item.type === 'photo' ? [item.data.storagePath] : [],
  );

  const signedUrlByPath = await getTicketDiaryPhotoUrls(photoPaths);

  const sourceSizeByPath = new Map<
    string,
    {
      width: number;
      height: number;
    }
  >();

  await Promise.all(
    savedItems.map(async item => {
      if (
        item.type !== 'photo' ||
        (item.data.sourceWidth !== undefined &&
          item.data.sourceHeight !== undefined)
      ) {
        return;
      }

      const uri = signedUrlByPath.get(item.data.storagePath);

      if (!uri) {
        return;
      }

      try {
        const size = await new Promise<{
          width: number;
          height: number;
        }>((resolve, reject) => {
          Image.getSize(
            uri,
            (width, height) =>
              resolve({
                width,
                height,
              }),
            reject,
          );
        });

        sourceSizeByPath.set(item.data.storagePath, size);
      } catch {}
    }),
  );

  return savedItems.map(item => {
    if (item.type === 'photo') {
      const uri = signedUrlByPath.get(item.data.storagePath);

      if (!uri) {
        throw new Error('저장된 다이어리 사진을 불러올 수 없습니다.');
      }

      const sourceSize = sourceSizeByPath.get(item.data.storagePath);

      return {
        type: 'photo',
        data: {
          ...item.data,
          uri,
          base64: null,
          storagePath: item.data.storagePath,
          sourceWidth: item.data.sourceWidth ?? sourceSize?.width,
          sourceHeight: item.data.sourceHeight ?? sourceSize?.height,
        },
      };
    }

    if (item.type === 'sticker') {
      const stickerDefinition = findDiaryStickerDefinition(item.data.stickerId);

      if (!stickerDefinition) {
        throw new Error(
          `스티커 정보를 찾을 수 없습니다: ${item.data.stickerId}`,
        );
      }

      return {
        type: 'sticker',
        data: {
          ...item.data,
          source: stickerDefinition.source,
        },
      };
    }

    return {
      type: 'text',
      data: item.data,
    };
  });
}

export function useTicketDiaryPersistence({
  ticketId,
  drawingCanvasRef,
}: UseTicketDiaryPersistenceParams) {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);
  const [isLeaveApproved, setIsLeaveApproved] = useState(false);
  const [drawingRevision, setDrawingRevision] = useState(0);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const items = useDiaryStore(state => state.items);
  const drawingIndex = useDiaryStore(state => state.drawingIndex);
  const paperType = useDiaryStore(state => state.paperType);
  const orientation = useDiaryStore(state => state.orientation);
  const setDrawingIndex = useDiaryStore(state => state.setDrawingIndex);
  const setSelectedTool = useDiaryStore(state => state.setSelectedTool);
  const initializeDiary = useDiaryStore(state => state.initializeDiary);
  const resetDiary = useDiaryStore(state => state.reset);

  const isMountedRef = useRef(true);
  const isAutosaveReadyRef = useRef(false);
  const hasLoadedDiaryRef = useRef(false);
  const isRestoringDrawingRef = useRef(false);
  const drawingCaptureVersionRef = useRef(0);
  const drawingBase64Ref = useRef<string | null>(null);
  const drawingStoragePathRef = useRef<string | null>(null);
  const uploadedDrawingRevisionRef = useRef(0);
  const shouldSaveDrawingImmediatelyRef = useRef(false);
  const uploadedPhotoPathByIdRef = useRef(new Map<string, string>());
  const managedStoragePathsRef = useRef(new Set<string>());
  const latestSnapshotRef = useRef<DiarySaveSnapshot | null>(null);
  const nextSnapshotVersionRef = useRef(0);
  const lastQueuedVersionRef = useRef(0);
  const lastSavedVersionRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const isSavingBeforeLeaveRef = useRef(false);
  const pendingNavigationActionRef = useRef<NavigationAction | null>(null);
  const snackbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enqueueDiarySaveRef = useRef<
    (snapshot: DiarySaveSnapshot) => Promise<void>
  >(async () => {});
  const showSnackbarRef = useRef<(message: string) => void>(() => {});
  const showAutosaveErrorRef = useRef<(error: unknown) => void>(() => {});

  const showSnackbar = (message: string) => {
    if (!isMountedRef.current) {
      return;
    }

    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
    }

    setSnackbarMessage(message);

    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbarMessage(null);
    }, 3000);
  };

  const showAutosaveError = (error: unknown) => {
    console.error('다이어리를 자동 저장하지 못했습니다.', error);
    showSnackbar(AUTOSAVE_ERROR_MESSAGE);
  };

  const saveDiarySnapshot = async (snapshot: DiarySaveSnapshot) => {
    const savedItems = await prepareDiaryItemsForSave(
      ticketId,
      snapshot.items,
      uploadedPhotoPathByIdRef.current,
    );

    for (const item of savedItems) {
      if (item.type === 'photo') {
        managedStoragePathsRef.current.add(item.data.storagePath);
      }
    }

    let drawingPath = snapshot.drawingBase64
      ? drawingStoragePathRef.current
      : null;

    if (
      snapshot.drawingRevision > uploadedDrawingRevisionRef.current &&
      snapshot.drawingBase64
    ) {
      drawingPath = await uploadTicketDiaryDrawing(
        ticketId,
        snapshot.drawingBase64,
      );

      drawingStoragePathRef.current = drawingPath;
      uploadedDrawingRevisionRef.current = snapshot.drawingRevision;
      managedStoragePathsRef.current.add(drawingPath);
    }

    await updateTicketDiaryData(ticketId, {
      version: TICKET_DIARY_VERSION,
      orientation: snapshot.orientation,
      paperType: snapshot.paperType,
      items: savedItems,
      drawingIndex: snapshot.items
        .slice(0, snapshot.drawingIndex)
        .filter(
          item => item.type !== 'text' || item.data.text.trim().length > 0,
        ).length,
      drawingPath,
    });

    const nextStoragePaths = new Set(
      savedItems.flatMap(item =>
        item.type === 'photo' ? [item.data.storagePath] : [],
      ),
    );

    if (drawingPath) {
      nextStoragePaths.add(drawingPath);
    }

    const removedStoragePaths = Array.from(
      managedStoragePathsRef.current,
    ).filter(path => !nextStoragePaths.has(path));

    const activePhotoIds = new Set(
      savedItems.flatMap(item => (item.type === 'photo' ? [item.data.id] : [])),
    );

    for (const photoId of uploadedPhotoPathByIdRef.current.keys()) {
      if (!activePhotoIds.has(photoId)) {
        uploadedPhotoPathByIdRef.current.delete(photoId);
      }
    }

    let didCleanupStorage = true;

    if (removedStoragePaths.length > 0) {
      try {
        await removeTicketDiaryFiles(removedStoragePaths);
      } catch (error) {
        console.error(
          '사용하지 않는 다이어리 파일을 정리하지 못했습니다.',
          error,
        );
        didCleanupStorage = false;
      }
    }

    managedStoragePathsRef.current = didCleanupStorage
      ? nextStoragePaths
      : new Set([...nextStoragePaths, ...removedStoragePaths]);

    lastSavedVersionRef.current = Math.max(
      lastSavedVersionRef.current,
      snapshot.version,
    );

    if (
      isMountedRef.current &&
      latestSnapshotRef.current?.version === snapshot.version
    ) {
      setHasUnsavedChanges(false);
    }
  };

  const enqueueDiarySave = (snapshot: DiarySaveSnapshot) => {
    if (snapshot.version <= lastQueuedVersionRef.current) {
      return saveQueueRef.current;
    }

    lastQueuedVersionRef.current = snapshot.version;

    const queuedSave = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveDiarySnapshot(snapshot))
      .catch(error => {
        if (lastQueuedVersionRef.current === snapshot.version) {
          lastQueuedVersionRef.current = lastSavedVersionRef.current;
        }

        throw error;
      });

    saveQueueRef.current = queuedSave;
    return queuedSave;
  };

  enqueueDiarySaveRef.current = enqueueDiarySave;
  showSnackbarRef.current = showSnackbar;
  showAutosaveErrorRef.current = showAutosaveError;

  usePreventRemove(
    hasUnsavedChanges && !isLeaveApproved,
    ({ data: { action } }) => {
      if (isSavingBeforeLeaveRef.current) {
        return;
      }

      isSavingBeforeLeaveRef.current = true;
      pendingNavigationActionRef.current = action;
      setIsSavingBeforeLeave(true);

      flushPendingDiarySaves(
        () => latestSnapshotRef.current,
        () => lastSavedVersionRef.current,
        enqueueDiarySaveRef.current,
      )
        .then(() => {
          setIsLeaveApproved(true);
        })
        .catch(error => {
          isSavingBeforeLeaveRef.current = false;
          pendingNavigationActionRef.current = null;
          setIsSavingBeforeLeave(false);
          showAutosaveErrorRef.current(error);
        });
    },
  );

  useEffect(() => {
    if (!isLeaveApproved) {
      return;
    }

    const action = pendingNavigationActionRef.current;

    if (!action) {
      return;
    }

    pendingNavigationActionRef.current = null;
    isSavingBeforeLeaveRef.current = false;
    setIsSavingBeforeLeave(false);
    setIsLeaveApproved(false);
    navigation.dispatch(action);
  }, [isLeaveApproved, navigation]);

  useEffect(() => {
    let isActive = true;

    async function loadDiary() {
      setIsLoading(true);
      isAutosaveReadyRef.current = false;
      hasLoadedDiaryRef.current = false;
      latestSnapshotRef.current = null;
      nextSnapshotVersionRef.current = 0;
      lastQueuedVersionRef.current = 0;
      lastSavedVersionRef.current = 0;
      setHasUnsavedChanges(false);
      uploadedDrawingRevisionRef.current = 0;
      uploadedPhotoPathByIdRef.current.clear();
      managedStoragePathsRef.current.clear();

      try {
        const diaryData = await getTicketDiaryData(ticketId);

        const [restoredItems, drawingBase64] = await Promise.all([
          restoreDiaryItems(diaryData.items),
          diaryData.drawingPath
            ? getTicketDiaryDrawingBase64(diaryData.drawingPath)
            : Promise.resolve(null),
        ]);

        if (!isActive) {
          return;
        }

        for (const item of diaryData.items) {
          if (item.type === 'photo') {
            uploadedPhotoPathByIdRef.current.set(
              item.data.id,
              item.data.storagePath,
            );
            managedStoragePathsRef.current.add(item.data.storagePath);
          }
        }

        if (diaryData.drawingPath) {
          managedStoragePathsRef.current.add(diaryData.drawingPath);
        }

        initializeDiary({
          orientation: diaryData.orientation,
          paperType: diaryData.paperType,
          items: restoredItems,
          drawingIndex: diaryData.drawingIndex,
        });

        await new Promise<void>(resolve => {
          requestAnimationFrame(() => resolve());
        });

        if (!isActive) {
          return;
        }

        if (!drawingCanvasRef.current) {
          throw new Error('그림 캔버스를 불러올 수 없습니다.');
        }

        isRestoringDrawingRef.current = true;

        try {
          drawingCanvasRef.current.clear();

          let hasStoredDrawing = false;

          if (drawingBase64) {
            try {
              await drawingCanvasRef.current.loadBase64Data(drawingBase64);
              hasStoredDrawing = await drawingCanvasRef.current.hasDrawing();
            } catch (drawingError) {
              console.error(
                '저장된 드로잉을 불러오지 못했습니다.',
                drawingError,
              );
              drawingCanvasRef.current.clear();
              showSnackbarRef.current('드로잉을 불러오지 못했어요');
            }
          }

          drawingBase64Ref.current = hasStoredDrawing ? drawingBase64 : null;
          drawingStoragePathRef.current = hasStoredDrawing
            ? diaryData.drawingPath
            : null;
          drawingCaptureVersionRef.current = 0;
          setDrawingRevision(0);
        } finally {
          isRestoringDrawingRef.current = false;
        }

        hasLoadedDiaryRef.current = true;
      } catch (error) {
        if (!isActive) {
          return;
        }

        resetDiary();
        drawingBase64Ref.current = null;
        drawingStoragePathRef.current = null;
        drawingCanvasRef.current?.clear();

        console.error('다이어리를 불러오지 못했습니다.', error);

        Alert.alert(
          '다이어리를 불러오지 못했어요',
          '잠시 후 다시 시도해 주세요.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDiary();

    return () => {
      isActive = false;
    };
  }, [ticketId, drawingCanvasRef, initializeDiary, resetDiary]);

  useEffect(() => {
    if (isLoading || !hasLoadedDiaryRef.current) {
      return;
    }

    if (!isAutosaveReadyRef.current) {
      isAutosaveReadyRef.current = true;
      return;
    }

    const snapshot: DiarySaveSnapshot = {
      version: nextSnapshotVersionRef.current + 1,
      orientation,
      paperType,
      items,
      drawingIndex,
      drawingBase64: drawingBase64Ref.current,
      drawingRevision,
    };

    nextSnapshotVersionRef.current = snapshot.version;
    latestSnapshotRef.current = snapshot;
    setHasUnsavedChanges(true);

    if (shouldSaveDrawingImmediatelyRef.current) {
      shouldSaveDrawingImmediatelyRef.current = false;

      enqueueDiarySaveRef.current(snapshot).catch(error => {
        showAutosaveErrorRef.current(error);
      });

      return;
    }

    const autosaveTimer = setTimeout(() => {
      enqueueDiarySaveRef.current(snapshot).catch(error => {
        showAutosaveErrorRef.current(error);
      });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      clearTimeout(autosaveTimer);
    };
  }, [drawingIndex, drawingRevision, isLoading, items, orientation, paperType]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        return;
      }

      const latestSnapshot = latestSnapshotRef.current;

      if (
        latestSnapshot &&
        latestSnapshot.version > lastSavedVersionRef.current
      ) {
        enqueueDiarySaveRef.current(latestSnapshot).catch(error => {
          showAutosaveErrorRef.current(error);
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (snackbarTimeoutRef.current) {
        clearTimeout(snackbarTimeoutRef.current);
      }

      const latestSnapshot = latestSnapshotRef.current;

      if (
        latestSnapshot &&
        latestSnapshot.version > lastSavedVersionRef.current
      ) {
        enqueueDiarySaveRef.current(latestSnapshot).catch(error => {
          console.error(
            '화면을 닫기 전 다이어리를 저장하지 못했습니다.',
            error,
          );
        });
      }

      resetDiary();
    };
  }, [resetDiary]);

  const handleDrawingChange = async () => {
    if (isRestoringDrawingRef.current || !drawingCanvasRef.current) {
      return;
    }

    const captureVersion = drawingCaptureVersionRef.current + 1;
    drawingCaptureVersionRef.current = captureVersion;

    try {
      const hasCanvasDrawing = await drawingCanvasRef.current.hasDrawing();

      if (captureVersion !== drawingCaptureVersionRef.current) {
        return;
      }

      if (!hasCanvasDrawing) {
        drawingBase64Ref.current = null;
        drawingStoragePathRef.current = null;
        setDrawingRevision(currentRevision => currentRevision + 1);
        return;
      }

      const drawingBase64 = await drawingCanvasRef.current.getBase64Data();

      if (captureVersion !== drawingCaptureVersionRef.current) {
        return;
      }

      if (drawingBase64Ref.current === null) {
        const lastPhotoIndex = items.reduce(
          (result, item, index) =>
            item.type === 'photo' ? index + 1 : result,
          0,
        );

        setDrawingIndex(lastPhotoIndex);
      }

      drawingBase64Ref.current = drawingBase64;
      setDrawingRevision(currentRevision => currentRevision + 1);
    } catch (error) {
      shouldSaveDrawingImmediatelyRef.current = false;
      showAutosaveError(error);
    }
  };

  const handleFinishDrawing = async () => {
    shouldSaveDrawingImmediatelyRef.current = true;
    await handleDrawingChange();
    setSelectedTool(null);
  };

  return {
    isLoading,
    isSavingBeforeLeave,
    snackbarMessage,
    hasDrawing: drawingBase64Ref.current !== null,
    handleDrawingChange,
    handleFinishDrawing,
  };
}
