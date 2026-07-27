import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../../styles/colors.ts';
import AppText from '../../../../components/common/AppText.tsx';
import GridPaper from './GridPaper.tsx';
import DiaryPhotoItem from './DiaryPhotoItem.tsx';
import { type DiaryPhoto, type EditorSize } from './photoTransform.ts';
import { selectDiaryPhoto } from './selectDiaryPhoto.ts';
import DiaryStickerPicker from './DiaryStickerPicker.tsx';
import DiaryStickerItem, {
  createDiarySticker,
  type DiarySticker,
} from './DiaryStickerItem.tsx';
import {
  DIARY_STICKER_PACKS,
  type DiaryStickerDefinition,
} from './diaryStickerPacks.ts';
import DiaryDrawingCanvas from './DiaryDrawingCanvas.tsx';
import DiaryBottomToolbar, { type DiaryToolId } from './DiaryBottomToolbar.tsx';
import DiaryPaperSelector, { type PaperType } from './DiaryPaperSelector.tsx';
import DiaryTextItem from './DiaryTextItem.tsx';
import DiaryTextToolbar from './DiaryTextToolbar.tsx';
import {
  createDiaryText,
  type DiaryText,
  type DiaryTextFrame,
  type DiaryTextStyle,
} from './diaryText.ts';

const MAXIMUM_DIARY_PHOTO_COUNT = 2;

type DiaryItem =
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

type SelectedDiaryItem =
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

function moveDiaryItemToTop(
  currentItems: DiaryItem[],
  selectedItem: Exclude<SelectedDiaryItem, null>,
) {
  const selectedItemIndex = currentItems.findIndex(
    item => item.type === selectedItem.type && item.data.id === selectedItem.id,
  );

  if (
    selectedItemIndex === -1 ||
    selectedItemIndex === currentItems.length - 1
  ) {
    return currentItems;
  }

  const itemToMove = currentItems[selectedItemIndex];

  return [
    ...currentItems.slice(0, selectedItemIndex),
    ...currentItems.slice(selectedItemIndex + 1),
    itemToMove,
  ];
}

function TicketDiaryPage() {
  const [selectedTool, setSelectedTool] = useState<DiaryToolId | null>(null);
  const [paperType, setPaperType] = useState<PaperType>('plain');
  const [selectedStickerPackId, setSelectedStickerPackId] = useState(
    DIARY_STICKER_PACKS[0]?.id ?? '',
  );

  // 다이어리 영역 (사진 배치 시 넘어가지 않게)
  const [editorSize, setEditorSize] = useState<EditorSize>({
    width: 0,
    height: 0,
  });

  // 사진, 스티커, 텍스트를 하나의 배열로 관리합니다.
  // 배열의 마지막 항목이 화면에서 가장 위에 표시됩니다.
  const [items, setItems] = useState<DiaryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedDiaryItem>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const selectedText =
    selectedItem?.type === 'text'
      ? items.find(
          item => item.type === 'text' && item.data.id === selectedItem.id,
        )
      : null;

  const handleEditorLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;

    setEditorSize({
      width,
      height,
    });
  };

  const handlePaperSelect = (next: PaperType) => {
    setPaperType(next);
    setSelectedTool(null);
  };

  const finishCurrentTextEditing = () => {
    const currentEditingTextId = editingTextId;

    if (currentEditingTextId === null) {
      return;
    }

    Keyboard.dismiss();
    setEditingTextId(null);

    setItems(currentItems => {
      const editingText = currentItems.find(
        item => item.type === 'text' && item.data.id === currentEditingTextId,
      );

      if (
        editingText?.type !== 'text' ||
        editingText.data.text.trim().length > 0
      ) {
        return currentItems;
      }

      return currentItems.filter(
        item => item.type !== 'text' || item.data.id !== currentEditingTextId,
      );
    });
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

    const nextSelectedItem: Exclude<SelectedDiaryItem, null> = {
      type: 'photo',
      id: photoId,
    };

    setSelectedItem(nextSelectedItem);

    setItems(currentItems =>
      moveDiaryItemToTop(currentItems, nextSelectedItem),
    );
  };

  const handleDeletePhoto = (photoId: string) => {
    setItems(currentItems =>
      currentItems.filter(
        item => item.type !== 'photo' || item.data.id !== photoId,
      ),
    );

    setSelectedItem(currentItem => {
      if (currentItem?.type === 'photo' && currentItem.id === photoId) {
        return null;
      }

      return currentItem;
    });
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

    const nextSelectedItem: Exclude<SelectedDiaryItem, null> = {
      type: 'sticker',
      id: stickerId,
    };

    setSelectedItem(nextSelectedItem);
    setItems(currentItems =>
      moveDiaryItemToTop(currentItems, nextSelectedItem),
    );
  };

  const handleDeleteSticker = (stickerId: string) => {
    setItems(currentItems =>
      currentItems.filter(
        item => item.type !== 'sticker' || item.data.id !== stickerId,
      ),
    );

    setSelectedItem(currentItem => {
      if (currentItem?.type === 'sticker' && currentItem.id === stickerId) {
        return null;
      }

      return currentItem;
    });
  };

  const handleAddText = () => {
    finishCurrentTextEditing();

    const newText = createDiaryText(editorSize);

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

    const nextSelectedItem: Exclude<SelectedDiaryItem, null> = {
      type: 'text',
      id: textId,
    };

    setSelectedItem(nextSelectedItem);

    setItems(currentItems =>
      moveDiaryItemToTop(currentItems, nextSelectedItem),
    );
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
    setItems(currentItems =>
      currentItems.filter(
        item => item.type !== 'text' || item.data.id !== textId,
      ),
    );

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

    const newSticker = createDiarySticker(stickerDefinition, editorSize);

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

    const selectedPhoto = await selectDiaryPhoto(editorSize);

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

  const handleFinishDrawing = () => {
    setSelectedTool(null);
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
        <View style={styles.editorArea} onLayout={handleEditorLayout}>
          <Pressable
            accessible={false}
            style={styles.editorBackground}
            onPress={handleDeselectDiaryItem}
          >
            {paperType === 'grid' ? <GridPaper /> : null}
          </Pressable>

          {items.map(item => {
            if (item.type === 'photo') {
              const photo = item.data;

              return (
                <DiaryPhotoItem
                  key={`photo-${photo.id}`}
                  photo={photo}
                  editorSize={editorSize}
                  isSelected={
                    selectedItem?.type === 'photo' &&
                    selectedItem.id === photo.id
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
                  editorSize={editorSize}
                  isSelected={
                    selectedItem?.type === 'sticker' &&
                    selectedItem.id === sticker.id
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
                editorSize={editorSize}
                isSelected={
                  selectedItem?.type === 'text' &&
                  selectedItem.id === textItem.id
                }
                isEditing={editingTextId === textItem.id}
                onSelect={() => handleSelectText(textItem.id)}
                onStartEditing={() => handleStartTextEditing(textItem.id)}
                onChangeText={value =>
                  handleChangeTextContent(textItem.id, value)
                }
                onChangeFrame={frame =>
                  handleChangeTextFrame(textItem.id, frame)
                }
                onChangeHeight={height =>
                  handleChangeTextHeight(textItem.id, height)
                }
                onFinishEditing={() => handleFinishTextEditing(textItem.id)}
                onDelete={() => handleDeleteText(textItem.id)}
              />
            );
          })}

          <DiaryDrawingCanvas isDrawingMode={selectedTool === 'drawing'} />

          {selectedTool === 'drawing' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="드로잉 완료"
              hitSlop={8}
              onPress={handleFinishDrawing}
              style={({ pressed }) => [
                styles.drawingDoneButton,
                pressed && styles.pressedDrawingDoneButton,
              ]}
            >
              <AppText size={14} weight="semiBold" color={colors.primary}>
                완료
              </AppText>
            </Pressable>
          ) : null}

          {selectedTool === 'sticker' ? (
            <DiaryStickerPicker
              selectedPackId={selectedStickerPackId}
              onSelectPack={setSelectedStickerPackId}
              onSelectSticker={handleAddSticker}
              onClose={() => setSelectedTool(null)}
            />
          ) : null}

          {selectedTool === 'paper' ? (
            <DiaryPaperSelector
              paperType={paperType}
              onSelect={handlePaperSelect}
            />
          ) : null}
        </View>

        {selectedText?.type === 'text' ? (
          <DiaryTextToolbar
            textItem={selectedText.data}
            onChangeStyle={handleChangeSelectedTextStyle}
          />
        ) : selectedTool !== 'sticker' && selectedTool !== 'drawing' ? (
          <DiaryBottomToolbar
            selectedTool={selectedTool}
            onPressTool={handlePressTool}
          />
        ) : null}
      </KeyboardAvoidingView>
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

  editorArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },

  editorBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  drawingDoneButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    minWidth: 60,
    height: 40,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },

  pressedDrawingDoneButton: {
    backgroundColor: colors.primarySoft,
  },
});
