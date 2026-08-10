import {
  getDisplayedDiaryTextPoint,
  type DiaryTextFrame,
} from './diaryText.ts';

test('서로 다른 세로 위치 배율에서도 회전된 텍스트 모서리를 정확히 계산한다', () => {
  const frame: DiaryTextFrame = {
    centerX: 130,
    centerY: 90,
    width: 200,
    height: 100,
    rotation: Math.PI / 2,
  };

  expect(getDisplayedDiaryTextPoint(frame, 0, 0, 2, 3)).toEqual({
    x: 360,
    y: 20,
  });
  expect(getDisplayedDiaryTextPoint(frame, 200, 100, 2, 3)).toEqual({
    x: 160,
    y: 420,
  });
});
