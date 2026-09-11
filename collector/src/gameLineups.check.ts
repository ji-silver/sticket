import assert from 'node:assert/strict';
import test from 'node:test';

import {
  enrichGamesWithKboScores,
  parseKboLineupsResponse,
  resolveKboGameSource,
} from './gameLineups.ts';

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

test('일정에 경기 ID가 없어도 KBO 경기 목록에서 같은 경기를 찾는다', () => {
  assert.deepEqual(
    resolveKboGameSource(
      {
        gameKey: '20260909-ssg-doosan-1',
        sourceGameId: null,
        season: 2026,
        gameDate: '2026-09-09',
        startTime: '18:30',
        awayTeamId: 'ssg',
        homeTeamId: 'doosan',
        status: 'SCHEDULED',
      },
      {
        game: [
          {
            G_ID: '20260909SKOB0',
            SR_ID: 0,
            G_DT: '20260909',
            G_TM: '18:30',
            AWAY_NM: 'SSG',
            HOME_NM: '두산',
            GAME_STATE_SC: '1',
            T_SCORE_CN: '2',
            B_SCORE_CN: '3',
          },
        ],
      },
    ),
    {
      gameId: '20260909SKOB0',
      seriesId: 0,
      awayScore: 2,
      homeScore: 3,
      isFinished: false,
    },
  );
});

test('KBO 경기 목록의 점수와 종료 상태를 갱신한다', async t => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        game: [
          {
            G_ID: '20260910SKOB0',
            SR_ID: 0,
            G_DT: '20260910',
            G_TM: '18:30',
            AWAY_NM: 'SSG',
            HOME_NM: '두산',
            GAME_STATE_SC: '3',
            GAME_RESULT_CK: 1,
            T_SCORE_CN: '4',
            B_SCORE_CN: '1',
          },
        ],
      }),
    );
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const [game] = await enrichGamesWithKboScores([
    {
      gameKey: '20260910-ssg-doosan-1',
      sourceGameId: null,
      season: 2026,
      seriesType: 'REGULAR',
      gameDate: '2026-09-10',
      startTime: '18:30',
      awayTeamId: 'ssg',
      homeTeamId: 'doosan',
      awayScore: 0,
      homeScore: 0,
      stadiumName: '잠실',
      status: 'IN_PROGRESS',
      cancellationReason: null,
    },
  ]);

  assert.equal(game.sourceGameId, '20260910SKOB0');
  assert.equal(game.awayScore, 4);
  assert.equal(game.homeScore, 1);
  assert.equal(game.status, 'FINISHED');
});
