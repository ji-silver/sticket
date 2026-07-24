import {
  Alert,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  ImagePlus,
  Notebook,
  Pencil,
  Sticker,
  Type,
} from 'lucide-react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../../styles/colors.ts';
import AppText from '../../../../components/common/AppText.tsx';
import GridPaper from './GridPaper.tsx';
import DiaryPhotos, {
  type DiaryPhoto,
  type EditorSize,
  selectDiaryPhoto,
} from './DiaryPhotos.tsx';
import DiaryStickerPicker from './DiaryStickerPicker.tsx';
import DiaryStickers, {
  createDiarySticker,
  type DiarySticker,
} from './DiaryStickers.tsx';
import { type DiaryStickerDefinition } from './diaryStickerPacks.ts';
import DiaryDrawingCanvas from './DiaryDrawingCanvas.tsx';

const MAXIMUM_DIARY_PHOTO_COUNT = 2;

const DIARY_TOOLS = [
  {
    id: 'paper',
    label: '속지',
    icon: Notebook,
  },
  {
    id: 'photo',
    label: '사진',
    icon: ImagePlus,
  },
  {
    id: 'sticker',
    label: '스티커',
    icon: Sticker,
  },
  {
    id: 'drawing',
    label: '드로잉',
    icon: Pencil,
  },
  {
    id: 'text',
    label: '텍스트',
    icon: Type,
  },
] as const;

type DiaryToolId = (typeof DIARY_TOOLS)[number]['id'];
type PaperType = 'plain' | 'grid';
type DiaryItem =
  | {
      type: 'photo';
      data: DiaryPhoto;
    }
  | {
      type: 'sticker';
      data: DiarySticker;
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
  | null;

function moveDiaryItemToTop(
  currentItems: DiaryItem[],
  selectedItem: Exclude<SelectedDiaryItem, null>,
) {
  const selectedItemIndex = currentItems.findIndex(
    item =>
      item.type === selectedItem.type && item.data.id === selectedItem.id,
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

  // 다이어리 영역 (사진 배치 시 넘어가지 않게)
  const [editorSize, setEditorSize] = useState<EditorSize>({
    width: 0,
    height: 0,
  });

  // 사진과 스티커를 하나의 배열로 관리합니다.
  // 배열의 마지막 항목이 화면에서 가장 위에 표시됩니다.
  const [items, setItems] = useState<DiaryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedDiaryItem>(null);


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

  // 이동·회전·크기 조절이 끝난 사진을 items 상태에 반영합니다.
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

  // 선택한 사진을 사진·스티커 중 가장 위로 올립니다.
  const handleSelectPhoto = (photoId: string) => {
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

  const handleAddSticker = (stickerDefinition: DiaryStickerDefinition) => {
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

  // 배경을 누르면 선택된 사진·스티커를 해제하고
  // 스티커 선택창이 열려 있다면 선택창도 닫습니다.
  const handleDeselectDiaryItem = () => {
    setSelectedItem(null);

    if (selectedTool === 'sticker') {
      setSelectedTool(null);
    }
  };


  const handlePressSelectPhoto = async () => {
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
      setSelectedItem(null);
    }

    if (toolId === 'photo') {
      handlePressSelectPhoto();
    }
  };

  // 드로잉을 끝내고 사진·스티커를 다시 편집할 수 있는 상태로 돌아갑니다.
  const handleFinishDrawing = () => {
    setSelectedTool(null);
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={selectedTool === 'sticker' ? [] : ['bottom']}
    >
      <View style={styles.editorArea} onLayout={handleEditorLayout}>
        <Pressable
          accessible={false}
          style={styles.editorBackground}
          onPress={handleDeselectDiaryItem}
        >
          {paperType === 'grid' ? <GridPaper /> : null}
        </Pressable>

        {items.map(item =>
          item.type === 'photo' ? (
            <DiaryPhotos
              key={`photo-${item.data.id}`}
              photos={[item.data]}
              editorSize={editorSize}
              selectedPhotoId={
                selectedItem?.type === 'photo' ? selectedItem.id : null
              }
              onSelectPhoto={handleSelectPhoto}
              onChangePhoto={handleChangePhoto}
              onDeletePhoto={handleDeletePhoto}
            />
          ) : (
            <DiaryStickers
              key={`sticker-${item.data.id}`}
              stickers={[item.data]}
              editorSize={editorSize}
              selectedStickerId={
                selectedItem?.type === 'sticker' ? selectedItem.id : null
              }
              onSelectSticker={handleSelectSticker}
              onChangeSticker={handleChangeSticker}
              onDeleteSticker={handleDeleteSticker}
            />
          ),
        )}

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
            onSelectSticker={handleAddSticker}
            onClose={() => setSelectedTool(null)}
          />
        ) : null}

        {selectedTool === 'paper' ? (
          <View style={styles.paperSelector}>
            <AppText size={13} weight="semiBold" color={colors.text}>
              속지 선택
            </AppText>

            <View style={styles.paperOptions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="무지 속지"
                accessibilityState={{
                  selected: paperType === 'plain',
                }}
                onPress={() => handlePaperSelect('plain')}
                style={({ pressed }) => [
                  styles.paperOption,
                  pressed && styles.pressedPaperOption,
                ]}
              >
                <View
                  style={[
                    styles.paperPreview,
                    paperType === 'plain' && styles.selectedPaperPreview,
                  ]}
                />

                <AppText
                  size={12}
                  weight={paperType === 'plain' ? 'semiBold' : 'regular'}
                  color={
                    paperType === 'plain'
                      ? colors.primary
                      : colors.textSecondary
                  }
                >
                  무지
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="모눈 속지"
                accessibilityState={{
                  selected: paperType === 'grid',
                }}
                onPress={() => handlePaperSelect('grid')}
                style={({ pressed }) => [
                  styles.paperOption,
                  pressed && styles.pressedPaperOption,
                ]}
              >
                <View
                  style={[
                    styles.paperPreview,
                    paperType === 'grid' && styles.selectedPaperPreview,
                  ]}
                >
                  <GridPaper />
                </View>

                <AppText
                  size={12}
                  weight={paperType === 'grid' ? 'semiBold' : 'regular'}
                  color={
                    paperType === 'grid' ? colors.primary : colors.textSecondary
                  }
                >
                  모눈
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {selectedTool !== 'sticker' && selectedTool !== 'drawing' ? (
        <View style={styles.toolbar}>
          {DIARY_TOOLS.map(tool => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;

            return (
              <Pressable
                key={tool.id}
                accessibilityRole={'button'}
                accessibilityLabel={`${tool.label} 도구`}
                onPress={() => handlePressTool(tool.id)}
                style={({ pressed }) => [
                  styles.toolButton,
                  pressed && styles.pressedToolButton,
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isSelected && styles.selectedIconContainer,
                  ]}
                >
                  <Icon
                    size={22}
                    strokeWidth={2}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                </View>

                <AppText
                  size={12}
                  weight={isSelected ? 'semiBold' : 'regular'}
                  color={isSelected ? colors.primary : colors.textSecondary}
                >
                  {tool.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export default TicketDiaryPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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

  paperSelector: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  paperOptions: {
    flexDirection: 'row',
    gap: 20,
  },

  paperOption: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },

  pressedPaperOption: {
    opacity: 0.6,
  },

  paperPreview: {
    width: 56,
    height: 72,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },

  selectedPaperPreview: {
    borderWidth: 2,
    borderColor: colors.primary,
  },

  toolbar: {
    flexDirection: 'row',
    height: 72,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  toolButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  pressedToolButton: {
    opacity: 0.6,
  },

  iconContainer: {
    width: 38,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderCurve: 'continuous',
  },

  selectedIconContainer: {
    backgroundColor: colors.primarySoft,
  },
});
