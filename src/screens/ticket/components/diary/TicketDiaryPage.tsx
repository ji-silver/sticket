import {
  Alert,
  AppState,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../../styles/colors.ts';
import DiaryCanvasArea from './DiaryCanvasArea.tsx';
import DiaryEditorUI, {
  DiaryEditorFeedbackUI,
  DiaryEditorOverlayUI,
} from './DiaryEditorUI.tsx';
import { useDiaryStore } from './store/useDiaryStore.ts';
import DiaryPhotoItem from './DiaryPhotoItem.tsx';
import { type DiaryPhoto, type EditorSize } from './photoTransform.ts';
import { selectDiaryPhoto } from './selectDiaryPhoto.ts';
import DiaryStickerItem, {
  createDiarySticker,
  type DiarySticker,
} from './DiaryStickerItem.tsx';
import {
  DIARY_STICKER_PACKS,
  type DiaryStickerDefinition,
} from './diaryStickerPacks.ts';

import type { DiaryDrawingCanvasRef } from './DiaryDrawingCanvas.tsx';

import type { DiaryToolId } from './DiaryBottomToolbar.tsx';

import type { DiaryLayerPanelItem } from './DiaryLayerPanel.tsx';

import type { PaperType } from './DiaryPaperSelector.tsx';

import DiaryTextItem from './DiaryTextItem.tsx';

import {
  createDiaryText,
  type DiaryText,
  type DiaryTextFrame,
  type DiaryTextStyle,
} from './diaryText.ts';

import {
  type SavedDiaryItem,
  TICKET_DIARY_VERSION,
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
import {
  getDiaryPageLayout,
  REFERENCE_DIARY_PAGE_HEIGHT,
  REFERENCE_DIARY_PAGE_WIDTH,
} from './diaryLayout.ts';

const MAXIMUM_DIARY_PHOTO_COUNT = 2;
const AUTOSAVE_DELAY_MS = 800;
const AUTOSAVE_ERROR_MESSAGE = '변경 내용을 저장하지 못했어요';
const DRAWING_LAYER_ID = '__drawing__';

interface TicketDiaryPageProps {
  ticketId: string;
}

export type DiaryItem =
  | {
      type: 'photo';
      data: DiaryPhoto;
    }
  | {
      type: 'sticker';
      data: DiarySticker;
    }
  | {
      type: 'text';
      data: DiaryText;
    };

export type SelectedDiaryItem =
  | {
      type: 'photo';
      id: string;
    }
  | {
      type: 'sticker';
      id: string;
    }
  | {
      type: 'text';
      id: string;
    }
  | null;

interface DiarySaveSnapshot {
  version: number;
  paperType: PaperType;
  items: DiaryItem[];
  drawingIndex: number;
  drawingBase64: string | null;
  drawingRevision: number;
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

        sourceSizeByPath.set(
          item.data.storagePath,

          size,
        );
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

function getDiaryItemLayerId(item: DiaryItem) {
  return `${item.type}:${item.data.id}`;
}

function createLayerPanelItems(
  items: DiaryItem[],
  drawingIndex: number,
  hasDrawing: boolean,
): DiaryLayerPanelItem[] {
  const bottomToTop: DiaryLayerPanelItem[] = items.map(item => ({
    id: getDiaryItemLayerId(item),
    type: item.type,
    label:
      item.type === 'text'
        ? item.data.text.trim() || '빈 텍스트'
        : item.type === 'sticker'
        ? '스티커'
        : '사진',
    imageSource:
      item.type === 'photo'
        ? {
            uri: item.data.uri,
          }
        : item.type === 'sticker'
        ? item.data.source
        : undefined,
  }));

  if (hasDrawing) {
    bottomToTop.splice(drawingIndex, 0, {
      id: DRAWING_LAYER_ID,
      type: 'drawing',
      label: '드로잉',
    });
  }

  return bottomToTop.reverse();
}

function TicketDiaryPage({ ticketId }: TicketDiaryPageProps) {
  const drawingCanvasRef = useRef<DiaryDrawingCanvasRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drawingRevision, setDrawingRevision] = useState(0);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

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

  const enqueueDiarySaveRef = useRef<
    (snapshot: DiarySaveSnapshot) => Promise<void>
  >(async () => {});

  const showSnackbarRef = useRef<(message: string) => void>(() => {});

  const showAutosaveErrorRef = useRef<(error: unknown) => void>(() => {});

  const snackbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedTool = useDiaryStore(state => state.selectedTool);

  const setSelectedTool = useDiaryStore(state => state.setSelectedTool);

  const setIsLayerPanelVisible = useDiaryStore(
    state => state.setIsLayerPanelVisible,
  );

  const paperType = useDiaryStore(state => state.paperType);
  const setPaperType = useDiaryStore(state => state.setPaperType);
  const items = useDiaryStore(state => state.items);
  const setItems = useDiaryStore(state => state.setItems);
  const drawingIndex = useDiaryStore(state => state.drawingIndex);
  const setDrawingIndex = useDiaryStore(state => state.setDrawingIndex);
  const selectedItem = useDiaryStore(state => state.selectedItem);
  const setSelectedItem = useDiaryStore(state => state.setSelectedItem);
  const editingTextId = useDiaryStore(state => state.editingTextId);
  const setEditingTextId = useDiaryStore(state => state.setEditingTextId);
  const initializeDiary = useDiaryStore(state => state.initializeDiary);
  const resetDiary = useDiaryStore(state => state.reset);

  const [editorWrapperSize, setEditorWrapperSize] = useState({
    width: 0,
    height: 0,
  });

  const [editorCanvasRegionSize, setEditorCanvasRegionSize] = useState({
    width: 0,
    height: 0,
  });

  const [editorSize] = useState<EditorSize>({
    width: REFERENCE_DIARY_PAGE_WIDTH,
    height: 524,
  });

  const isLandscape = editorWrapperSize.width > editorWrapperSize.height;

  const availableEditorHeight = Math.max(0, editorCanvasRegionSize.height);
  const { isPhoneLayout, pageWidth } = getDiaryPageLayout(
    editorWrapperSize,
    availableEditorHeight,
  );
  const editorScale = Math.max(0.01, pageWidth / editorSize.width);
  const displayedEditorWidth = pageWidth;
  const displayedEditorHeight = REFERENCE_DIARY_PAGE_HEIGHT * editorScale;
  const displayScaleY =
    editorScale * (REFERENCE_DIARY_PAGE_HEIGHT / editorSize.height);
  const activeEditorSize = editorSize;
  const layerPanelEditorSize: EditorSize = {
    width: editorSize.width,
    height: REFERENCE_DIARY_PAGE_HEIGHT,
  };

  const selectedText =
    selectedItem?.type === 'text'
      ? items.find(
          item => item.type === 'text' && item.data.id === selectedItem.id,
        )
      : null;

  const hasDrawing = drawingBase64Ref.current !== null;
  const layerPanelItems = createLayerPanelItems(
    items,
    drawingIndex,
    hasDrawing,
  );
  const selectedLayerId =
    selectedTool === 'drawing'
      ? DRAWING_LAYER_ID
      : selectedItem
      ? `${selectedItem.type}:${selectedItem.id}`
      : null;

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
          paperType: diaryData.paperType,
          items: restoredItems,
          drawingIndex: diaryData.drawingIndex,
        });

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
  }, [ticketId, initializeDiary, resetDiary]);

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
      paperType,
      items,
      drawingIndex,
      drawingBase64: drawingBase64Ref.current,
      drawingRevision,
    };

    nextSnapshotVersionRef.current = snapshot.version;
    latestSnapshotRef.current = snapshot;

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
  }, [drawingIndex, drawingRevision, isLoading, items, paperType]);

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

  const handleEditorWrapperLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;

    setEditorWrapperSize({
      width,
      height,
    });
  };

  const handleEditorCanvasRegionLayout = ({
    nativeEvent,
  }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;

    setEditorCanvasRegionSize({
      width,
      height,
    });
  };

  const handlePaperSelect = (next: PaperType) => {
    setPaperType(next);
    setSelectedTool(null);
  };

  const removeDiaryItem = (itemType: DiaryItem['type'], itemId: string) => {
    const removedItemIndex = items.findIndex(
      item => item.type === itemType && item.data.id === itemId,
    );

    if (removedItemIndex === -1) {
      return;
    }

    setItems(currentItems =>
      currentItems.filter(
        item => item.type !== itemType || item.data.id !== itemId,
      ),
    );

    if (removedItemIndex < drawingIndex) {
      setDrawingIndex(currentIndex => Math.max(0, currentIndex - 1));
    }
  };

  const finishCurrentTextEditing = () => {
    const currentEditingTextId = editingTextId;

    if (currentEditingTextId === null) {
      return;
    }

    Keyboard.dismiss();
    setEditingTextId(null);

    const editingText = items.find(
      item => item.type === 'text' && item.data.id === currentEditingTextId,
    );

    if (
      editingText?.type === 'text' &&
      editingText.data.text.trim().length === 0
    ) {
      removeDiaryItem('text', currentEditingTextId);
    }
  };

  const handleChangePhoto = (changedPhoto: DiaryPhoto) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.type === 'photo' && item.data.id === changedPhoto.id
          ? {
              type: 'photo',
              data: changedPhoto,
            }
          : item,
      ),
    );
  };

  const handleSelectPhoto = (photoId: string) => {
    finishCurrentTextEditing();

    setSelectedItem({
      type: 'photo',
      id: photoId,
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    removeDiaryItem('photo', photoId);

    setSelectedItem(currentItem =>
      currentItem?.type === 'photo' && currentItem.id === photoId
        ? null
        : currentItem,
    );
  };

  const handleChangeSticker = (changedSticker: DiarySticker) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.type === 'sticker' && item.data.id === changedSticker.id
          ? {
              type: 'sticker',
              data: changedSticker,
            }
          : item,
      ),
    );
  };

  const handleSelectSticker = (stickerId: string) => {
    finishCurrentTextEditing();

    setSelectedItem({
      type: 'sticker',
      id: stickerId,
    });
  };

  const handleDeleteSticker = (stickerId: string) => {
    removeDiaryItem('sticker', stickerId);

    setSelectedItem(currentItem =>
      currentItem?.type === 'sticker' && currentItem.id === stickerId
        ? null
        : currentItem,
    );
  };

  const handleAddText = () => {
    finishCurrentTextEditing();

    const newText = createDiaryText(activeEditorSize);

    if (newText === null) {
      Alert.alert(
        '텍스트를 추가할 수 없습니다',
        '다이어리 화면을 다시 열어주세요.',
      );

      return;
    }

    setItems(currentItems => [
      ...currentItems,
      {
        type: 'text',
        data: newText,
      },
    ]);

    setSelectedItem({
      type: 'text',
      id: newText.id,
    });

    setEditingTextId(newText.id);
    setSelectedTool(null);
  };

  const handleSelectText = (textId: string) => {
    finishCurrentTextEditing();

    setSelectedItem({
      type: 'text',
      id: textId,
    });
  };

  const handleStartTextEditing = (textId: string) => {
    setSelectedItem({
      type: 'text',
      id: textId,
    });

    setEditingTextId(textId);
  };

  const handleChangeTextContent = (textId: string, value: string) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.type === 'text' && item.data.id === textId
          ? {
              type: 'text',
              data: {
                ...item.data,

                text: value,
              },
            }
          : item,
      ),
    );
  };

  const handleChangeTextFrame = (textId: string, frame: DiaryTextFrame) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.type === 'text' && item.data.id === textId
          ? {
              type: 'text',
              data: {
                ...item.data,

                ...frame,
              },
            }
          : item,
      ),
    );
  };

  const handleChangeTextHeight = (textId: string, height: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.type === 'text' && item.data.id === textId
          ? {
              type: 'text',
              data: {
                ...item.data,

                height,
              },
            }
          : item,
      ),
    );
  };

  const handleFinishTextEditing = (textId: string) => {
    setEditingTextId(currentId => (currentId === textId ? null : currentId));
  };

  const handleDeleteText = (textId: string) => {
    removeDiaryItem('text', textId);

    setSelectedItem(currentItem =>
      currentItem?.type === 'text' && currentItem.id === textId
        ? null
        : currentItem,
    );

    setEditingTextId(currentId => (currentId === textId ? null : currentId));

    Keyboard.dismiss();
  };

  const handleChangeSelectedTextStyle = (patch: Partial<DiaryTextStyle>) => {
    if (selectedItem?.type !== 'text') {
      return;
    }

    const selectedTextId = selectedItem.id;

    setItems(currentItems =>
      currentItems.map(item =>
        item.type === 'text' && item.data.id === selectedTextId
          ? {
              type: 'text',
              data: {
                ...item.data,
                style: {
                  ...item.data.style,

                  ...patch,
                },
              },
            }
          : item,
      ),
    );
  };

  const handleAddSticker = (stickerDefinition: DiaryStickerDefinition) => {
    finishCurrentTextEditing();

    const newSticker = createDiarySticker(stickerDefinition, activeEditorSize);

    if (newSticker === null) {
      return;
    }

    setItems(currentItems => [
      ...currentItems,
      {
        type: 'sticker',
        data: newSticker,
      },
    ]);
    setSelectedItem({
      type: 'sticker',
      id: newSticker.id,
    });
    setSelectedTool(null);
  };

  const handleDeselectDiaryItem = () => {
    finishCurrentTextEditing();

    setSelectedItem(null);

    if (selectedTool === 'sticker') {
      setSelectedTool(null);
    }
  };

  const handlePressSelectPhoto = async () => {
    finishCurrentTextEditing();

    const photoCount = items.filter(item => item.type === 'photo').length;

    if (photoCount >= MAXIMUM_DIARY_PHOTO_COUNT) {
      Alert.alert(
        '사진을 추가할 수 없습니다',
        '사진은 최대 2장까지 추가할 수 있습니다.',
      );

      return;
    }

    const selectedPhoto = await selectDiaryPhoto(activeEditorSize);

    setSelectedTool(null);

    if (selectedPhoto === null) {
      return;
    }

    setItems(currentItems => [
      ...currentItems,
      {
        type: 'photo',
        data: selectedPhoto,
      },
    ]);

    setSelectedItem({
      type: 'photo',
      id: selectedPhoto.id,
    });
  };

  const handlePressTool = (toolId: DiaryToolId) => {
    if (toolId === 'layers') {
      finishCurrentTextEditing();
      setSelectedTool(null);
      setIsLayerPanelVisible(currentValue => !currentValue);
      return;
    }

    setIsLayerPanelVisible(false);
    setSelectedTool(toolId);

    if (toolId === 'drawing') {
      finishCurrentTextEditing();
      setSelectedItem(null);
    }

    if (toolId === 'photo') {
      handlePressSelectPhoto();
    }

    if (toolId === 'text') {
      handleAddText();
    }
  };

  const handleSelectLayer = (layerId: string) => {
    if (layerId === DRAWING_LAYER_ID) {
      finishCurrentTextEditing();
      setSelectedItem(null);
      setSelectedTool(null);
      return;
    }

    const selectedLayerItem = items.find(
      item => getDiaryItemLayerId(item) === layerId,
    );

    if (!selectedLayerItem) {
      return;
    }

    setSelectedTool(null);

    if (selectedLayerItem.type === 'photo') {
      handleSelectPhoto(selectedLayerItem.data.id);
    } else if (selectedLayerItem.type === 'sticker') {
      handleSelectSticker(selectedLayerItem.data.id);
    } else {
      handleSelectText(selectedLayerItem.data.id);
    }
  };

  const handleMoveLayer = (layerId: string, targetIndex: number) => {
    const topToBottom = [...layerPanelItems];
    const sourceIndex = topToBottom.findIndex(item => item.id === layerId);

    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      return;
    }

    const [movedLayer] = topToBottom.splice(sourceIndex, 1);
    topToBottom.splice(targetIndex, 0, movedLayer);

    const itemByLayerId = new Map(
      items.map(item => [getDiaryItemLayerId(item), item]),
    );
    const bottomToTop = topToBottom.reverse();
    const nextItems = bottomToTop.flatMap(layer => {
      const item = itemByLayerId.get(layer.id);
      return item ? [item] : [];
    });

    const nextDrawingIndex = bottomToTop.findIndex(
      layer => layer.id === DRAWING_LAYER_ID,
    );

    setItems(nextItems);

    if (nextDrawingIndex !== -1) {
      setDrawingIndex(nextDrawingIndex);
    }
  };

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
          (result, item, index) => (item.type === 'photo' ? index + 1 : result),
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

  const renderDiaryItem = (item: DiaryItem) => {
    if (item.type === 'photo') {
      const photo = item.data;

      return (
        <DiaryPhotoItem
          key={`photo-${photo.id}`}
          photo={photo}
          editorSize={activeEditorSize}
          editorScale={editorScale}
          displayScaleY={displayScaleY}
          isSelected={
            selectedItem?.type === 'photo' && selectedItem.id === photo.id
          }
          onSelect={() => handleSelectPhoto(photo.id)}
          onChange={handleChangePhoto}
          onDelete={() => handleDeletePhoto(photo.id)}
        />
      );
    }

    if (item.type === 'sticker') {
      const sticker = item.data;

      return (
        <DiaryStickerItem
          key={`sticker-${sticker.id}`}
          sticker={sticker}
          editorSize={activeEditorSize}
          editorScale={editorScale}
          displayScaleY={displayScaleY}
          isSelected={
            selectedItem?.type === 'sticker' && selectedItem.id === sticker.id
          }
          onSelect={() => handleSelectSticker(sticker.id)}
          onChange={handleChangeSticker}
          onDelete={() => handleDeleteSticker(sticker.id)}
        />
      );
    }

    const textItem = item.data;

    return (
      <DiaryTextItem
        key={`text-${textItem.id}`}
        textItem={textItem}
        editorSize={activeEditorSize}
        displayScale={editorScale}
        displayScaleY={displayScaleY}
        isSelected={
          selectedItem?.type === 'text' && selectedItem.id === textItem.id
        }
        isEditing={editingTextId === textItem.id}
        onSelect={() => handleSelectText(textItem.id)}
        onStartEditing={() => handleStartTextEditing(textItem.id)}
        onChangeText={value => handleChangeTextContent(textItem.id, value)}
        onChangeFrame={frame => handleChangeTextFrame(textItem.id, frame)}
        onChangeHeight={height => handleChangeTextHeight(textItem.id, height)}
        onFinishEditing={() => handleFinishTextEditing(textItem.id)}
        onDelete={() => handleDeleteText(textItem.id)}
      />
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={selectedTool === 'sticker' ? [] : ['bottom']}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardAvoidingContainer}
      >
        <DiaryCanvasArea
          displayedEditorWidth={displayedEditorWidth}
          displayedEditorHeight={displayedEditorHeight}
          editorSize={editorSize}
          editorScale={editorScale}
          displayScaleY={displayScaleY}
          isPhoneLayout={isPhoneLayout}
          isLandscape={isLandscape}
          layerPanelEditorSize={layerPanelEditorSize}
          layerPanelItems={layerPanelItems}
          selectedLayerId={selectedLayerId}
          drawingCanvasRef={drawingCanvasRef}
          onEditorWrapperLayout={handleEditorWrapperLayout}
          onEditorCanvasRegionLayout={handleEditorCanvasRegionLayout}
          onDeselectDiaryItem={handleDeselectDiaryItem}
          onDrawingChange={handleDrawingChange}
          onFinishDrawing={handleFinishDrawing}
          onSelectLayer={handleSelectLayer}
          onMoveLayer={handleMoveLayer}
          onCloseLayerPanel={() => setIsLayerPanelVisible(false)}
          renderDiaryItem={renderDiaryItem}
        >
          <DiaryEditorOverlayUI
            onAddSticker={handleAddSticker}
            onCloseStickerPicker={() => setSelectedTool(null)}
            onSelectPaper={handlePaperSelect}
          />
        </DiaryCanvasArea>

        <DiaryEditorUI
          selectedTextItem={selectedText}
          onChangeTextStyle={handleChangeSelectedTextStyle}
          onPressTool={handlePressTool}
        />
      </KeyboardAvoidingView>

      <DiaryEditorFeedbackUI
        isLoading={isLoading}
        snackbarMessage={snackbarMessage}
      />
    </SafeAreaView>
  );
}

export default TicketDiaryPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  keyboardAvoidingContainer: {
    flex: 1,
  },
});
