import { PixelRatio } from 'react-native';
import DiaryImageItem from './DiaryImageItem.tsx';
import {
  getMaximumSourceScale,
  MAXIMUM_PHOTO_SCALE,
  type DiaryPhoto,
  type EditorSize,
} from './photoTransform.ts';

interface DiaryPhotoItemProps {
  photo: DiaryPhoto;
  editorSize: EditorSize;
  editorScale: number;
  displayScaleY: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (photo: DiaryPhoto) => void;
  onDelete: () => void;
}

function DiaryPhotoItem({
  photo,
  editorSize,
  editorScale,
  displayScaleY,
  isSelected,
  onSelect,
  onChange,
  onDelete,
}: DiaryPhotoItemProps) {
  const maximumScale = getMaximumSourceScale(
    photo.sourceWidth,
    photo.sourceHeight,
    photo.width,
    photo.height,
    editorScale,
    PixelRatio.get(),
    MAXIMUM_PHOTO_SCALE,
  );

  return (
    <DiaryImageItem
      source={{ uri: photo.uri }}
      width={photo.width}
      height={photo.height}
      initialMatrix={photo.matrix}
      editorSize={editorSize}
      displayScale={editorScale}
      displayScaleY={displayScaleY}
      maximumScale={maximumScale}
      isSelected={isSelected}
      itemLabel="사진"
      accessibilityLabel="다이어리 사진"
      onSelect={onSelect}
      onChangeMatrix={matrix =>
        onChange({
          ...photo,
          matrix,
        })
      }
      onDelete={onDelete}
    />
  );
}

export default DiaryPhotoItem;
