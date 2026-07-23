import DiaryImageItem from './DiaryImageItem.tsx';
import {
  type EditorSize,
  type Matrix3,
  translate3,
} from './photoTransform.ts';
import {
  Alert,
  Image,
  type ImageRequireSource,
} from 'react-native';
import { type DiaryStickerDefinition } from './diaryStickerPacks.ts';

const MINIMUM_INITIAL_STICKER_SIZE = 112;
const MAXIMUM_INITIAL_STICKER_SIZE = 160;
const INITIAL_STICKER_WIDTH_RATIO = 0.28;

export interface DiarySticker {
  id: string;
  stickerId: string;
  source: ImageRequireSource;
  width: number;
  height: number;
  matrix: Matrix3; // 스티커 현재 위치, 회전, 확대 및 축소 상태
}

interface DiaryStickersProps {
  stickers: DiarySticker[];
  editorSize: EditorSize;
  selectedStickerId: string | null;
  onSelectSticker: (stickerId: string) => void;
  onChangeSticker: (sticker: DiarySticker) => void;
  onDeleteSticker: (stickerId: string) => void;
}

export function createDiarySticker(
  sticker: DiaryStickerDefinition,
  editorSize: EditorSize,
): DiarySticker | null {
  if (editorSize.width <= 0 || editorSize.height <= 0) {
    Alert.alert(
      '스티커를 추가할 수 없습니다.',
      '다이어리 화면을 다시 열어주세요.',
    );

    return null;
  }

  // 원본 이미지 크기
  const resolvedImage = Image.resolveAssetSource(sticker.source);

  if (
    resolvedImage.width === undefined ||
    resolvedImage.width <= 0 ||
    resolvedImage.height <= 0
  ) {
    Alert.alert('스티커를 불러올 수 없습니다.', '잠시 후 다시 시도해주세요.');

    return null;
  }

  const initialStickerSize = Math.min(
    MAXIMUM_INITIAL_STICKER_SIZE,
    Math.max(
      MINIMUM_INITIAL_STICKER_SIZE,
      editorSize.width * INITIAL_STICKER_WIDTH_RATIO,
    ),
  );

  // 이미지 비율
  const initialRatio = Math.min(
    initialStickerSize / resolvedImage.width,
    initialStickerSize / resolvedImage.height,
  );

  const stickerWidth = resolvedImage.width * initialRatio;
  const stickerHeight = resolvedImage.height * initialRatio;
  const initialX = (editorSize.width - stickerWidth) / 2;
  const initialY = (editorSize.height - stickerHeight) / 2;

  return {
    id: `${sticker.id}-${Date.now()}`,
    stickerId: sticker.id,
    source: sticker.source,
    width: stickerWidth,
    height: stickerHeight,
    matrix: translate3(initialX, initialY),
  };
}

function DiaryStickers({
  stickers,
  editorSize,
  selectedStickerId,
  onSelectSticker,
  onChangeSticker,
  onDeleteSticker,
}: DiaryStickersProps) {
  return (
    <>
      {stickers.map((sticker, index) => (
        <DiaryImageItem
          key={sticker.id}
          source={sticker.source}
          width={sticker.width}
          height={sticker.height}
          initialMatrix={sticker.matrix}
          editorSize={editorSize}
          isSelected={sticker.id === selectedStickerId}
          itemLabel="스티커"
          accessibilityLabel={`다이어리 스티커 ${index + 1}`}
          onSelect={() => onSelectSticker(sticker.id)}
          onChangeMatrix={matrix => onChangeSticker({ ...sticker, matrix })}
          onDelete={() => onDeleteSticker(sticker.id)}
        />
      ))}
    </>
  );
}

export default DiaryStickers;
