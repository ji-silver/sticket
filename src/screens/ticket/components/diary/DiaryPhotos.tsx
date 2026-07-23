import DiaryImageItem from './DiaryImageItem.tsx';
import {
  type DiaryPhoto,
  type EditorSize,
} from './photoTransform.ts';

export type {
  DiaryPhoto,
  EditorSize,
  Matrix3,
} from './photoTransform.ts';
export { selectDiaryPhoto } from './selectDiaryPhoto.ts';

interface DiaryPhotosProps {
  photos: DiaryPhoto[];
  editorSize: EditorSize;
  selectedPhotoId: string | null;
  onSelectPhoto: (photoId: string) => void;
  onChangePhoto: (photo: DiaryPhoto) => void;
  onDeletePhoto: (photoId: string) => void;
}

function DiaryPhotos({
  photos,
  editorSize,
  selectedPhotoId,
  onSelectPhoto,
  onChangePhoto,
  onDeletePhoto,
}: DiaryPhotosProps) {
  return (
    <>
      {photos.map((photo, index) => (
        <DiaryImageItem
          key={photo.id}
          source={{ uri: photo.uri }}
          width={photo.width}
          height={photo.height}
          initialMatrix={photo.matrix}
          editorSize={editorSize}
          isSelected={photo.id === selectedPhotoId}
          itemLabel="사진"
          accessibilityLabel={`다이어리 사진 ${index + 1}`}
          onSelect={() => onSelectPhoto(photo.id)}
          onChangeMatrix={matrix =>
            onChangePhoto({
              ...photo,
              matrix,
            })
          }
          onDelete={() => onDeletePhoto(photo.id)}
        />
      ))}
    </>
  );
}

export default DiaryPhotos;
