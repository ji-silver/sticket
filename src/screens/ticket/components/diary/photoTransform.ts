export const MINIMUM_PHOTO_SCALE = 0.25;
export const MAXIMUM_PHOTO_SCALE = 4;

export interface EditorSize {
  width: number;
  height: number;
}

export type Matrix3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface DiaryPhoto {
  id: string;
  uri: string;
  width: number;
  height: number;
  matrix: Matrix3;
}

export interface Point {
  x: number;
  y: number;
}

export function clamp(value: number, minimum: number, maximum: number) {
  'worklet';

  return Math.min(maximum, Math.max(minimum, value));
}

function identity3(): Matrix3 {
  'worklet';

  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

function multiply3(first: Matrix3, second: Matrix3): Matrix3 {
  'worklet';

  return [
    first[0] * second[0] + first[3] * second[1] + first[6] * second[2],

    first[1] * second[0] + first[4] * second[1] + first[7] * second[2],

    first[2] * second[0] + first[5] * second[1] + first[8] * second[2],

    first[0] * second[3] + first[3] * second[4] + first[6] * second[5],

    first[1] * second[3] + first[4] * second[4] + first[7] * second[5],

    first[2] * second[3] + first[5] * second[4] + first[8] * second[5],

    first[0] * second[6] + first[3] * second[7] + first[6] * second[8],

    first[1] * second[6] + first[4] * second[7] + first[7] * second[8],

    first[2] * second[6] + first[5] * second[7] + first[8] * second[8],
  ];
}

export function translate3(x: number, y: number): Matrix3 {
  'worklet';

  return [1, 0, 0, 0, 1, 0, x, y, 1];
}

function scale3(x: number, y: number): Matrix3 {
  'worklet';

  return [x, 0, 0, 0, y, 0, 0, 0, 1];
}

function rotate3(radians: number): Matrix3 {
  'worklet';

  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);

  return [cosine, sine, 0, -sine, cosine, 0, 0, 0, 1];
}

export function applyTransformations(
  translation: Point,
  scaleValue: number,
  rotationValue: number,
  origin: Point,
  savedTransform: Matrix3,
): Matrix3 {
  'worklet';

  let matrix = identity3();

  matrix = multiply3(matrix, translate3(translation.x, translation.y));
  matrix = multiply3(matrix, translate3(origin.x, origin.y));
  matrix = multiply3(matrix, scale3(scaleValue, scaleValue));
  matrix = multiply3(matrix, translate3(-origin.x, -origin.y));
  matrix = multiply3(matrix, translate3(origin.x, origin.y));
  matrix = multiply3(matrix, rotate3(rotationValue));
  matrix = multiply3(matrix, translate3(-origin.x, -origin.y));

  return multiply3(savedTransform, matrix);
}

export function getMaximumPhotoScale(
  photoWidth: number,
  photoHeight: number,
  rotation: number,
  editorSize: EditorSize,
) {
  'worklet';

  if (editorSize.width <= 0 || editorSize.height <= 0) {
    return MAXIMUM_PHOTO_SCALE;
  }

  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const rotatedWidth =
    Math.abs(cosine) * photoWidth + Math.abs(sine) * photoHeight;
  const rotatedHeight =
    Math.abs(sine) * photoWidth + Math.abs(cosine) * photoHeight;

  return Math.min(
    editorSize.width / rotatedWidth,
    editorSize.height / rotatedHeight,
    MAXIMUM_PHOTO_SCALE,
  );
}

export function constrainPhotoPosition(
  matrix: Matrix3,
  photoWidth: number,
  photoHeight: number,
  editorSize: EditorSize,
): Matrix3 {
  'worklet';

  if (editorSize.width <= 0 || editorSize.height <= 0) {
    return matrix;
  }

  const currentScale = Math.max(Math.hypot(matrix[0], matrix[1]), 0.0001);
  const rotation = Math.atan2(matrix[1], matrix[0]);
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const rotatedWidth =
    Math.abs(cosine) * photoWidth + Math.abs(sine) * photoHeight;
  const rotatedHeight =
    Math.abs(sine) * photoWidth + Math.abs(cosine) * photoHeight;
  const maximumScaleThatFits = getMaximumPhotoScale(
    photoWidth,
    photoHeight,
    rotation,
    editorSize,
  );
  const constrainedScale = Math.min(currentScale, maximumScaleThatFits);
  const boundingWidth = rotatedWidth * constrainedScale;
  const boundingHeight = rotatedHeight * constrainedScale;
  const currentCenterX = matrix[6] + photoWidth / 2;
  const currentCenterY = matrix[7] + photoHeight / 2;
  const constrainedCenterX = clamp(
    currentCenterX,
    boundingWidth / 2,
    editorSize.width - boundingWidth / 2,
  );
  const constrainedCenterY = clamp(
    currentCenterY,
    boundingHeight / 2,
    editorSize.height - boundingHeight / 2,
  );

  return [
    cosine * constrainedScale,
    sine * constrainedScale,
    matrix[2],
    -sine * constrainedScale,
    cosine * constrainedScale,
    matrix[5],
    constrainedCenterX - photoWidth / 2,
    constrainedCenterY - photoHeight / 2,
    matrix[8],
  ];
}

export function getTransformedPhotoPoint(
  matrix: Matrix3,
  photoWidth: number,
  photoHeight: number,
  x: number,
  y: number,
): Point {
  'worklet';

  const scale = Math.hypot(matrix[0], matrix[1]);
  const rotation = Math.atan2(matrix[1], matrix[0]);
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const offsetX = (x - photoWidth / 2) * scale;
  const offsetY = (y - photoHeight / 2) * scale;

  return {
    x:
      matrix[6] +
      photoWidth / 2 +
      cosine * offsetX -
      sine * offsetY,
    y:
      matrix[7] +
      photoHeight / 2 +
      sine * offsetX +
      cosine * offsetY,
  };
}
