import DiaryImageItem from './DiaryImageItem.tsx';
import {
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
  return (
    <DiaryImageItem
      source={{ uri: photo.uri }}
      width={photo.width}
      height={photo.height}
      initialMatrix={photo.matrix}
      editorSize={editorSize}
      displayScale={editorScale}
      displayScaleY={displayScaleY}
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
