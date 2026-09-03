import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AppText from '../../../../components/common/AppText.tsx';
import AppBottomSheet from '../../../../components/common/AppBottomSheet.tsx';
import InlineActionButton from '../../../../components/common/InlineActionButton.tsx';
import { colors } from '../../../../styles/colors.ts';
import DiaryCanvasArea from './DiaryCanvasArea.tsx';
import DiaryEditorUI, {
  DiaryEditorFeedbackUI,
  DiaryEditorOverlayUI,
} from './DiaryEditorUI.tsx';
import { useDiaryStore } from './store/useDiaryStore.ts';
import DiaryPhotoItem from './DiaryPhotoItem.tsx';
import { type DiaryPhoto } from './photoTransform.ts';
import { type DiaryPhotoSource, selectDiaryPhoto } from './selectDiaryPhoto.ts';
import DiaryStickerItem, {
  createDiarySticker,
  type DiarySticker,
} from './DiaryStickerItem.tsx';
import type { DiaryStickerDefinition } from './diaryStickerPacks.ts';

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
  getDiaryEditorSize,
  getDiaryPageLayout,
  getDiaryPageSize,
} from './diaryLayout.ts';
import { useTicketDiaryPersistence } from './useTicketDiaryPersistence.ts';
import type { Ticket } from '../../../../features/ticket/types.ts';
import DiaryExportCard from './DiaryExportCard.tsx';
import { type DiaryExportMode, exportDiaryImage } from './diaryExport.ts';

const MAXIMUM_DIARY_PHOTO_COUNT = 2;
const DRAWING_LAYER_ID = '__drawing__';
const DETAIL_HEADER_HEIGHT = 52;
const DETAIL_TAB_HEIGHT = 48;

function waitForViewUpdate() {
  return new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

interface TicketDiaryPageProps {
  ticket: Ticket;
}

export interface TicketDiaryPageHandle {
  hasDecorations: () => boolean;
  openExportOptions: () => void;
  resetDecorations: () => Promise<void>;
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

const TicketDiaryPage = forwardRef<TicketDiaryPageHandle, TicketDiaryPageProps>(
  function TicketDiaryPageContent({ ticket }, ref) {
    const { top } = useSafeAreaInsets();
    const ticketId = ticket.id;
    const drawingCanvasRef = useRef<DiaryDrawingCanvasRef>(null);
    const exportCanvasRef = useRef<View>(null);
    const exportCardRef = useRef<View>(null);
    const {
      isLoading,
      hasLoadError,
      retryLoadDiary,
      isSavingBeforeLeave,
      snackbarMessage,
      hasDrawing,
      handleDrawingChange,
      handleFinishDrawing,
      resetDiaryDecorations,
    } = useTicketDiaryPersistence({ ticketId, drawingCanvasRef });

    const selectedTool = useDiaryStore(state => state.selectedTool);

    const setSelectedTool = useDiaryStore(state => state.setSelectedTool);

    const setIsLayerPanelVisible = useDiaryStore(
      state => state.setIsLayerPanelVisible,
    );

    const paperType = useDiaryStore(state => state.paperType);
    const setPaperType = useDiaryStore(state => state.setPaperType);
    const orientation = useDiaryStore(state => state.orientation);
    const items = useDiaryStore(state => state.items);
    const setItems = useDiaryStore(state => state.setItems);
    const drawingIndex = useDiaryStore(state => state.drawingIndex);
    const setDrawingIndex = useDiaryStore(state => state.setDrawingIndex);
    const selectedItem = useDiaryStore(state => state.selectedItem);
    const setSelectedItem = useDiaryStore(state => state.setSelectedItem);
    const editingTextId = useDiaryStore(state => state.editingTextId);
    const setEditingTextId = useDiaryStore(state => state.setEditingTextId);
    const [isExportSheetVisible, setIsExportSheetVisible] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportPaperUri, setExportPaperUri] = useState<string | null>(null);
    const pendingExportModeRef = useRef<DiaryExportMode | null>(null);
    const exportCardReadyRef = useRef<{
      resolve: () => void;
      reject: (error: Error) => void;
    } | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        hasDecorations: () =>
          !isLoading &&
          (items.length > 0 || hasDrawing || paperType !== 'plain'),
        openExportOptions: () => {
          if (!isLoading && !hasLoadError && !isExporting) {
            setIsExportSheetVisible(true);
          }
        },
        resetDecorations: resetDiaryDecorations,
      }),
      [
        hasDrawing,
        hasLoadError,
        isExporting,
        isLoading,
        items.length,
        paperType,
        resetDiaryDecorations,
      ],
    );

    const [editorWrapperSize, setEditorWrapperSize] = useState({
      width: 0,
      height: 0,
    });

    const [editorCanvasRegionSize, setEditorCanvasRegionSize] = useState({
      width: 0,
      height: 0,
    });
    const [isPhotoSourceSheetVisible, setIsPhotoSourceSheetVisible] =
      useState(false);
    const pendingPhotoSourceRef = useRef<DiaryPhotoSource | null>(null);
    const editingPageWidthRef = useRef(0);

    const pageSize = getDiaryPageSize(orientation);
    const editorSize = getDiaryEditorSize(orientation);

    const isLandscape = orientation === 'landscape';

    const availableEditorHeight = Math.max(0, editorCanvasRegionSize.height);
    const { pageWidth: measuredPageWidth } = getDiaryPageLayout(
      editorWrapperSize,
      availableEditorHeight,
      pageSize,
    );
    const shouldKeepEditingPageSize =
      editingTextId !== null || Keyboard.isVisible();
    const pageWidth =
      shouldKeepEditingPageSize && editingPageWidthRef.current > 0
        ? editingPageWidthRef.current
        : measuredPageWidth;
    const editorScale = Math.max(0.01, pageWidth / editorSize.width);
    const displayedEditorWidth = pageWidth;
    const displayedEditorHeight =
      pageSize.height * (pageWidth / pageSize.width);
    const displayScaleY = displayedEditorHeight / editorSize.height;
    const activeEditorSize = editorSize;

    const selectedText =
      selectedItem?.type === 'text'
        ? items.find(
            item => item.type === 'text' && item.data.id === selectedItem.id,
          )
        : null;

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
      editingPageWidthRef.current = pageWidth;

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
      editingPageWidthRef.current = pageWidth;

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

      const newSticker = createDiarySticker(
        stickerDefinition,
        activeEditorSize,
      );

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

    const handleAddPhoto = async (source: DiaryPhotoSource) => {
      const selectedPhoto = await selectDiaryPhoto(activeEditorSize, source);

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

    const handlePressSelectPhoto = () => {
      finishCurrentTextEditing();

      const photoCount = items.filter(item => item.type === 'photo').length;

      if (photoCount >= MAXIMUM_DIARY_PHOTO_COUNT) {
        setSelectedTool(null);
        Alert.alert(
          '사진을 추가할 수 없습니다',
          '사진은 최대 2장까지 추가할 수 있습니다.',
        );

        return;
      }

      setIsPhotoSourceSheetVisible(true);
    };

    const requestDiaryPhoto = (source: DiaryPhotoSource) => {
      pendingPhotoSourceRef.current = source;
      setIsPhotoSourceSheetVisible(false);
    };

    const handlePhotoSourceSheetClosed = () => {
      const source = pendingPhotoSourceRef.current;
      pendingPhotoSourceRef.current = null;
      setSelectedTool(null);

      if (source) {
        handleAddPhoto(source);
      }
    };

    const prepareExportComposition = (paperUri: string) =>
      new Promise<void>((resolve, reject) => {
        exportCardReadyRef.current = { resolve, reject };
        setExportPaperUri(paperUri);
      });

    const handleExportCardImageLoad = () => {
      const pending = exportCardReadyRef.current;
      exportCardReadyRef.current = null;

      if (pending) {
        waitForViewUpdate().then(pending.resolve);
      }
    };

    const handleExportCardImageError = () => {
      const pending = exportCardReadyRef.current;
      exportCardReadyRef.current = null;
      pending?.reject(new Error('다이어리 이미지를 합성할 수 없습니다.'));
    };

    const handleExportDiary = async (mode: DiaryExportMode) => {
      if (isExporting) {
        return;
      }

      setIsExporting(true);
      finishCurrentTextEditing();
      setSelectedItem(null);
      setSelectedTool(null);
      setIsLayerPanelVisible(false);

      try {
        await waitForViewUpdate();

        await exportDiaryImage({
          mode,
          paperRef: exportCanvasRef,
          compositionRef: exportCardRef,
          prepareComposition: prepareExportComposition,
        });
      } catch (error) {
        console.error('다이어리를 내보내지 못했습니다.', error);
        Alert.alert(
          '다이어리를 내보내지 못했어요',
          '잠시 후 다시 시도해 주세요.',
        );
      } finally {
        exportCardReadyRef.current = null;
        setExportPaperUri(null);
        setIsExporting(false);
      }
    };

    const requestDiaryExport = (mode: DiaryExportMode) => {
      pendingExportModeRef.current = mode;
      setIsExportSheetVisible(false);
    };

    const handleExportSheetClosed = () => {
      const mode = pendingExportModeRef.current;
      pendingExportModeRef.current = null;

      if (mode) {
        handleExportDiary(mode);
      }
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

    if (hasLoadError) {
      return (
        <SafeAreaView
          style={[styles.container, styles.loadErrorContainer]}
          edges={['bottom']}
        >
          <AppText
            size={17}
            weight="semiBold"
            align="center"
            accessibilityRole="alert"
          >
            다이어리를 불러오지 못했어요
          </AppText>
          <AppText
            size={14}
            color={colors.textSecondary}
            align="center"
            lineHeight={20}
          >
            네트워크 상태를 확인하고 다시 시도해 주세요.
          </AppText>
          <InlineActionButton
            label="다시 시도"
            tone="primary"
            onPress={retryLoadDiary}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView
        style={styles.container}
        edges={selectedTool === 'sticker' ? [] : ['bottom']}
      >
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={
            top + DETAIL_HEADER_HEIGHT + DETAIL_TAB_HEIGHT
          }
          style={styles.keyboardAvoidingContainer}
        >
          <DiaryCanvasArea
            displayedEditorWidth={displayedEditorWidth}
            displayedEditorHeight={displayedEditorHeight}
            editorSize={editorSize}
            pageSize={pageSize}
            editorScale={editorScale}
            displayScaleY={displayScaleY}
            isLandscape={isLandscape}
            isTextEditing={editingTextId !== null}
            layerPanelItems={layerPanelItems}
            selectedLayerId={selectedLayerId}
            drawingCanvasRef={drawingCanvasRef}
            exportCanvasRef={exportCanvasRef}
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

        <AppBottomSheet
          visible={isPhotoSourceSheetVisible}
          title="사진 추가"
          onClose={() => setIsPhotoSourceSheetVisible(false)}
          onClosed={handlePhotoSourceSheetClosed}
          closeAccessibilityLabel="사진 추가 닫기"
        >
          <View style={[styles.sheetActionList, styles.photoSheetActionList]}>
            <SheetActionRow
              title="사진 촬영"
              weight="regular"
              onPress={() => requestDiaryPhoto('camera')}
            />

            <View style={styles.sheetActionDivider} />

            <SheetActionRow
              title="앨범에서 선택"
              weight="regular"
              onPress={() => requestDiaryPhoto('library')}
            />
          </View>
        </AppBottomSheet>

        <AppBottomSheet
          visible={isExportSheetVisible}
          title="다이어리 내보내기"
          description="내보낼 이미지 형태를 선택해 주세요"
          onClose={() => setIsExportSheetVisible(false)}
          onClosed={handleExportSheetClosed}
          closeAccessibilityLabel="다이어리 내보내기 닫기"
        >
          <View style={styles.sheetActionList}>
            <SheetActionRow
              title="경기 정보와 함께"
              onPress={() => requestDiaryExport('withGameInfo')}
            />

            <View style={styles.sheetActionDivider} />

            <SheetActionRow
              title="다이어리만"
              onPress={() => requestDiaryExport('diaryOnly')}
            />
          </View>
        </AppBottomSheet>

        {exportPaperUri ? (
          <View pointerEvents="none" style={styles.exportCardHost}>
            <DiaryExportCard
              ref={exportCardRef}
              ticket={ticket}
              diaryImageUri={exportPaperUri}
              pageSize={pageSize}
              onImageLoad={handleExportCardImageLoad}
              onImageError={handleExportCardImageError}
            />
          </View>
        ) : null}

        <DiaryEditorFeedbackUI
          isLoading={isLoading || isSavingBeforeLeave || isExporting}
          snackbarMessage={snackbarMessage}
        />
      </SafeAreaView>
    );
  },
);

export default TicketDiaryPage;

function SheetActionRow({
  title,
  weight = 'semiBold',
  onPress,
}: {
  title: string;
  weight?: 'regular' | 'semiBold';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sheetActionRow,
        pressed && styles.sheetActionRowPressed,
      ]}
    >
      <AppText size={16} weight={weight}>
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  keyboardAvoidingContainer: {
    flex: 1,
  },

  loadErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },

  sheetActionList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },

  photoSheetActionList: {
    marginTop: -12,
  },

  sheetActionRow: {
    height: 58,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },

  sheetActionRowPressed: {
    backgroundColor: colors.background,
  },

  sheetActionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  exportCardHost: {
    position: 'absolute',
    top: 0,
    left: -10000,
  },
});
