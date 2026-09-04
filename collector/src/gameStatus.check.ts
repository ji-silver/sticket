import assert from 'node:assert/strict';
import test from 'node:test';

import { parseGameStatus } from './gameStatus.ts';

test('과거 경기에서 양 팀 점수가 있으면 종료 상태로 판정한다', () => {
  assert.equal(
    parseGameStatus(
      '2026-09-03',
      '2026-09-04',
      '18:30',
      '',
      '',
      3,
      2,
    ),
    'FINISHED',
  );
});

test('오늘 경기에서 양 팀 점수가 있으면 진행 중으로 판정한다', () => {
  assert.equal(
    parseGameStatus(
      '2026-09-04',
      '2026-09-04',
      '18:30',
      '',
      '',
      3,
      2,
    ),
    'IN_PROGRESS',
  );
});

test('취소와 연기 상태는 점수보다 우선한다', () => {
  assert.equal(
    parseGameStatus(
      '2026-09-03',
      '2026-09-04',
      '18:30',
      '',
      '우천 취소',
      null,
      null,
    ),
    'CANCELLED',
  );
  assert.equal(
    parseGameStatus(
      '2026-09-03',
      '2026-09-04',
      '18:30',
      '',
      '경기 연기',
      3,
      2,
    ),
    'POSTPONED',
  );
});
