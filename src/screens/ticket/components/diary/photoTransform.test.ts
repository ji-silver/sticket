import {
  applyTransformations,
  getDisplayedPhotoPoint,
  getInitialPhotoSize,
  type Matrix3,
} from './photoTransform.ts';

describe('applyTransformations', () => {
  it('축소되고 회전된 이미지도 드래그한 거리만큼 이동한다', () => {
    const savedMatrix: Matrix3 = [0, 0.5, 0, -0.5, 0, 0, 30, 40, 1];

    const movedMatrix = applyTransformations(
      { x: 20, y: 10 },
      1,
      0,
      { x: 0, y: 0 },
      savedMatrix,
    );

    expect(movedMatrix[6]).toBe(50);
    expect(movedMatrix[7]).toBe(50);
  });
});

describe('getInitialPhotoSize', () => {
  it('작은 원본도 다이어리 절반 크기로 확대한다', () => {
    expect(
      getInitialPhotoSize(
        { width: 100, height: 100 },
        { width: 900, height: 1200 },
      ),
    ).toEqual({ width: 450, height: 450 });
  });

  it('사진 비율을 유지하며 다이어리 절반 안에 맞춘다', () => {
    expect(
      getInitialPhotoSize(
        { width: 1000, height: 2000 },
        { width: 900, height: 1200 },
      ),
    ).toEqual({ width: 300, height: 600 });
  });
});

describe('getDisplayedPhotoPoint', () => {
  it('서로 다른 세로 위치 배율에서도 회전된 이미지 모서리를 정확히 계산한다', () => {
    const matrix: Matrix3 = [0, 1, 0, -1, 0, 0, 30, 40, 1];

    expect(getDisplayedPhotoPoint(matrix, 200, 100, 0, 0, 2, 3)).toEqual({
      x: 360,
      y: 20,
    });
    expect(getDisplayedPhotoPoint(matrix, 200, 100, 200, 100, 2, 3)).toEqual({
      x: 160,
      y: 420,
    });
  });
});
