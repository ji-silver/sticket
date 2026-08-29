import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getRecentGameDates,
  getRemainingSeasonMonths,
  getUpcomingScheduleMonths,
} from './dateWindow.ts';

test('오늘과 어제 날짜를 월·연도 경계에서도 계산한다', () => {
  assert.deepEqual(getRecentGameDates('2026-08-02'), [
    '2026-08-01',
    '2026-08-02',
  ]);
  assert.deepEqual(getRecentGameDates('2026-08-01'), [
    '2026-07-31',
    '2026-08-01',
  ]);
  assert.deepEqual(getRecentGameDates('2026-01-01'), [
    '2025-12-31',
    '2026-01-01',
  ]);
  assert.deepEqual(getRecentGameDates('2026-01-01', 'today'), ['2026-01-01']);
  assert.deepEqual(getRecentGameDates('2026-01-01', 'yesterday'), [
    '2025-12-31',
  ]);
});

test('시즌 잔여 월과 매일 갱신할 두 달을 계산한다', () => {
  assert.deepEqual(getRemainingSeasonMonths('2026-08-02'), [
    '08',
    '09',
    '10',
    '11',
  ]);
  assert.deepEqual(getUpcomingScheduleMonths('2026-08-02'), ['08', '09']);
  assert.deepEqual(getUpcomingScheduleMonths('2026-11-01'), ['11']);
  assert.deepEqual(getRemainingSeasonMonths('2026-12-01'), []);
});
