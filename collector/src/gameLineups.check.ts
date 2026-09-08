import assert from 'node:assert/strict';
import test from 'node:test';

import { parseKboLineupsResponse } from './gameLineups.ts';

function createTeamTable(prefix: string) {
  const positions = ['중', '二', '우', '一', '지', '좌', '三', '포', '유'];
  const rows = positions.map((position, index) => ({
    row: [
      { Text: String(index + 1) },
      { Text: position },
      { Text: `${prefix}${index + 1}` },
    ],
  }));

  rows.splice(3, 0, {
    row: [{ Text: '3' }, { Text: '주' }, { Text: `${prefix}대주자` }],
  });

  return JSON.stringify({ rows });
}

test('발표된 KBO 라인업에서 양 팀의 실제 선발 1~9번만 추출한다', () => {
  const lineups = parseKboLineupsResponse([
    [{ LINEUP_CK: true }],
    [],
    [],
    [createTeamTable('홈')],
    [createTeamTable('원정')],
  ]);

  assert.equal(lineups?.away.length, 9);
  assert.equal(lineups?.home.length, 9);
  assert.deepEqual(lineups?.away[0], {
    battingOrder: 1,
    position: 'CF',
    playerName: '원정1',
  });
  assert.equal(lineups?.away[2].playerName, '원정3');
});

test('발표 전 KBO 라인업 응답은 저장하지 않는다', () => {
  const lineups = parseKboLineupsResponse([
    [{ LINEUP_CK: false }],
    [],
    [],
    [createTeamTable('이전홈')],
    [createTeamTable('이전원정')],
  ]);

  assert.equal(lineups, null);
});
