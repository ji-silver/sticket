import { colors } from '../../../../styles/colors.ts';
import { clamp, type EditorSize } from './photoTransform.ts';

export const MINIMUM_TEXT_WIDTH = 96;
export const MINIMUM_TEXT_HEIGHT = 37;
const DEFAULT_TEXT_WIDTH = 220;

type DiaryTextAlign = 'left' | 'center' | 'right';

export interface DiaryTextStyle {
  color: string;
  fontSize: number;
  align: DiaryTextAlign;
  isBold: boolean;
  hasUnderline: boolean;
  hasStrikeThrough: boolean;
}

export interface DiaryTextFrame {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
}

export interface DiaryText extends DiaryTextFrame {
  id: string;
  text: string;
  style: DiaryTextStyle;
}

export function createDiaryText(editorSize: EditorSize): DiaryText | null {
  if (editorSize.width <= 0 || editorSize.height <= 0) {
    return null;
  }

  const availableWidth = editorSize.width - 32;

  const initialWidth = Math.min(
    DEFAULT_TEXT_WIDTH,
    Math.max(MINIMUM_TEXT_WIDTH, availableWidth),
  );

  return {
    id: Date.now().toString(),
    text: '',
    centerX: editorSize.width / 2,
    centerY: editorSize.height / 2,
    width: initialWidth,
    height: MINIMUM_TEXT_HEIGHT,
    rotation: 0,
    style: {
      color: colors.text,
      fontSize: 18,
      align: 'center',
      isBold: false,
      hasUnderline: false,
      hasStrikeThrough: false,
    },
  };
}

//회전된 텍스트가 영역 밖으로 나가지 않게 중심 좌표 제한
export function constrainDiaryTextFrame(
  frame: DiaryTextFrame,
  editorSize: EditorSize,
  verticalScaleRatio = 1,
): DiaryTextFrame {
  'worklet';

  if (editorSize.width <= 0 || editorSize.height <= 0) {
    return frame;
  }

  const cosine = Math.cos(frame.rotation);
  const sine = Math.sin(frame.rotation);

  const boundingWidth =
    Math.abs(cosine) * frame.width + Math.abs(sine) * frame.height;

  const boundingHeight =
    Math.abs(sine) * frame.width + Math.abs(cosine) * frame.height;

  const horizontalInset = Math.min(boundingWidth / 2, editorSize.width / 2);

  const verticalInset = Math.min(boundingHeight / 2, editorSize.height / 2);

  return {
    ...frame,
    centerX: clamp(
      frame.centerX,
      horizontalInset,
      editorSize.width - horizontalInset,
    ),
    centerY: clamp(
      frame.centerY,
      verticalInset,
      editorSize.height -
        verticalInset +
        boundingHeight * (1 - verticalScaleRatio),
    ),
  };
}

export function getDiaryTextPoint(
  frame: DiaryTextFrame,
  localX: number,
  localY: number,
) {
  'worklet';

  const cosine = Math.cos(frame.rotation);
  const sine = Math.sin(frame.rotation);

  const offsetX = localX - frame.width / 2;

  const offsetY = localY - frame.height / 2;

  return {
    x: frame.centerX + cosine * offsetX - sine * offsetY,
    y: frame.centerY + sine * offsetX + cosine * offsetY,
  };
}

export function getDisplayedDiaryTextPoint(
  frame: DiaryTextFrame,
  localX: number,
  localY: number,
  displayScale: number,
  displayScaleY: number,
) {
  'worklet';

  const point = getDiaryTextPoint(frame, localX, localY);
  const frameTop = frame.centerY - frame.height / 2;

  return {
    x: point.x * displayScale,
    y: frameTop * displayScaleY + (point.y - frameTop) * displayScale,
  };
}
