import assert from 'node:assert/strict';
import test from 'node:test';

import { getRecentGameDates } from './dateWindow.ts';

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
});
