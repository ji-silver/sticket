import { getInitialPhotoSize } from './photoTransform.ts';

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
