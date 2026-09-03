가import assert from 'node:assert/strict';
import test from 'node:test';

import { assertScheduleCollectionHealth } from './scheduleCollectionHealth.ts';

test('자동 수집에서 월간 원본 경기 행이 0건이면 실패한다', () => {
  assert.throws(
    () =>
      assertScheduleCollectionHealth({
        shouldRequireGames: true,
        rawRowCount: 0,
        parsedGameCount: 0,
      }),
    /KBO 월간 경기 일정이 한 건도 수집되지 않았습니다/,
  );
});

test('원본 경기 행이 있지만 한 건도 분석하지 못하면 실패한다', () => {
  assert.throws(
    () =>
      assertScheduleCollectionHealth({
        shouldRequireGames: true,
        rawRowCount: 10,
        parsedGameCount: 0,
      }),
    /KBO 월간 경기 행을 분석하지 못했습니다/,
  );
});

test('오늘 경기가 없어도 월간 경기를 분석했다면 성공한다', () => {
  assert.doesNotThrow(() =>
    assertScheduleCollectionHealth({
      shouldRequireGames: true,
      rawRowCount: 10,
      parsedGameCount: 10,
    }),
  );
});

test('수동 과거 수집은 빈 달을 허용한다', () => {
  assert.doesNotThrow(() =>
    assertScheduleCollectionHealth({
      shouldRequireGames: false,
      rawRowCount: 0,
      parsedGameCount: 0,
    }),
  );
});
