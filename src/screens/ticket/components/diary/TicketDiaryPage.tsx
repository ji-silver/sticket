import { type LayoutChangeEvent, Pressable, StyleSheet, View, } from 'react-native';
import { ImagePlus, Notebook, Pencil, Sticker, Type, } from 'lucide-react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../../styles/colors.ts';
import AppText from '../../../../components/common/AppText.tsx';
import GridPaper from './GridPaper.tsx';
import DiaryPhotos, { type DiaryPhoto, type EditorSize, selectDiaryPhoto, } from './DiaryPhotos.tsx';
import DiaryStickerPicker from './DiaryStickerPicker.tsx';
import DiaryStickers, { createDiarySticker, type DiarySticker, } from './DiaryStickers.tsx';
import { type DiaryStickerDefinition } from './diaryStickerPacks.ts';

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

function TicketDiaryPage() {
  const [selectedTool, setSelectedTool] = useState<DiaryToolId | null>(null);
  const [paperType, setPaperType] = useState<PaperType>('plain');

  // 다이어리 영역 (사진 배치 시 넘어가지 않게)
  const [editorSize, setEditorSize] = useState<EditorSize>({
    width: 0,
    height: 0,
  });

  const [photos, setPhotos] = useState<DiaryPhoto[]>([]); // 현재 다이어리에 들어있는 모든 사진
  const [stickers, setStickers] = useState<DiarySticker[]>([]);
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

  // 이동·회전·크기 조절이 끝난 사진을 photos 상태 반영
  const handleChangePhoto = (changedPhoto: DiaryPhoto) => {
    setPhotos(currentPhotos =>
      currentPhotos.map(photo =>
        photo.id === changedPhoto.id ? changedPhoto : photo,
      ),
    );
  };

  // 사진을 선택할 때 다른 사진보다 위에 표시되도록
  const handleSelectPhoto = (photoId: string) => {
    setSelectedItem({
      type: 'photo',
      id: photoId,
    });

    setPhotos(currentPhotos => {
      const selectedPhotoIndex = currentPhotos.findIndex(
        photo => photo.id === photoId,
      );

      if (
        selectedPhotoIndex === -1 ||
        selectedPhotoIndex === currentPhotos.length - 1
      ) {
        return currentPhotos;
      }

      const selectedPhoto = currentPhotos[selectedPhotoIndex];

      return [
        ...currentPhotos.slice(0, selectedPhotoIndex),
        ...currentPhotos.slice(selectedPhotoIndex + 1),
        selectedPhoto,
      ];
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(currentPhotos =>
      currentPhotos.filter(photo => photo.id !== photoId),
    );

    setSelectedItem(currentItem => {
      if (currentItem?.type === 'photo' && currentItem.id === photoId) {
        return null;
      }

      return currentItem;
    });
  };

  const handleChangeSticker = (changedSticker: DiarySticker) => {
    setStickers(currentStickers =>
      currentStickers.map(sticker =>
        sticker.id === changedSticker.id ? changedSticker : sticker,
      ),
    );
  };


  const handleSelectSticker = (stickerId: string) => {
    setSelectedItem({
      type: 'sticker',
      id: stickerId,
    });

    setStickers(currentStickers => {
      const selectedStickerIndex = currentStickers.findIndex(
        sticker => sticker.id === stickerId,
      );

      if (
        selectedStickerIndex === -1 ||
        selectedStickerIndex === currentStickers.length - 1
      ) {
        return currentStickers;
      }

      const selectedSticker = currentStickers[selectedStickerIndex];

      return [
        ...currentStickers.slice(0, selectedStickerIndex),
        ...currentStickers.slice(selectedStickerIndex + 1),
        selectedSticker,
      ];
    });
  };


  const handleDeleteSticker = (stickerId: string) => {
    setStickers(currentStickers =>
      currentStickers.filter(sticker => sticker.id !== stickerId),
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

    setStickers(currentStickers => [...currentStickers, newSticker]);
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
    const selectedPhoto = await selectDiaryPhoto(editorSize);

    if (selectedPhoto === null) {
      return;
    }

    setPhotos(currentPhotos => [...currentPhotos, selectedPhoto]);

    setSelectedItem({
      type: 'photo',
      id: selectedPhoto.id,
    });
  };


  const handlePressTool = (toolId: DiaryToolId) => {
    setSelectedTool(toolId);

    if (toolId === 'photo') {
      handlePressSelectPhoto();
    }
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

        <DiaryPhotos
          photos={photos}
          editorSize={editorSize}
          selectedPhotoId={
            selectedItem?.type === 'photo' ? selectedItem.id : null
          }
          onSelectPhoto={handleSelectPhoto}
          onChangePhoto={handleChangePhoto}
          onDeletePhoto={handleDeletePhoto}
        />

        <DiaryStickers
          stickers={stickers}
          editorSize={editorSize}
          selectedStickerId={
            selectedItem?.type === 'sticker' ? selectedItem.id : null
          }
          onSelectSticker={handleSelectSticker}
          onChangeSticker={handleChangeSticker}
          onDeleteSticker={handleDeleteSticker}
        />

        {selectedTool === 'sticker' ? (
          <DiaryStickerPicker onSelectSticker={handleAddSticker} />
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

      {selectedTool !== 'sticker' ? (
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
