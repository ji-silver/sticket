import assert from 'node:assert/strict';
import test from 'node:test';
import { parseKboStandings } from './kboStandings.ts';

const rows = [
  ['1', 'KT', '142', '88', '49', '5', '0.642', '0'],
  ['2', '삼성', '141', '83', '55', '3', '0.601', '5.5'],
  ['3', 'KIA', '140', '76', '62', '2', '0.551', '12.5'],
  ['4', 'LG', '141', '77', '63', '1', '0.550', '12.5'],
  ['5', '두산', '143', '73', '65', '5', '0.529', '15.5'],
  ['6', 'SSG', '142', '64', '73', '5', '0.467', '24'],
  ['7', 'NC', '142', '63', '77', '2', '0.450', '26.5'],
  ['8', '롯데', '140', '61', '76', '3', '0.445', '27'],
  ['9', '한화', '143', '57', '82', '4', '0.410', '32'],
  ['10', '키움', '144', '50', '90', '4', '0.357', '39.5'],
];

test('공식 표의 기준일과 승패무, 승률, 게임차를 그대로 읽는다', () => {
  const result = parseKboStandings('(2026년 10월07일 기준)', rows, 2026);
  assert.equal(result.asOfDate, '2026-10-07');
  assert.equal(result.season, 2026);
  assert.equal(result.standings.length, 10);
  assert.deepEqual(result.standings[0], {
    teamId: 'kt',
    teamName: 'KT',
    rank: 1,
    played: 142,
    wins: 88,
    losses: 49,
    draws: 5,
    winRate: 0.642,
    gamesBehind: 0,
  });
});

test('일부 구단만 읽었으면 저장 가능한 스냅샷을 만들지 않는다', () => {
  assert.throws(() =>
    parseKboStandings('(2026년 10월07일 기준)', rows.slice(0, 9), 2026),
  );
});

test('중복 구단과 알 수 없는 구단을 거부한다', () => {
  assert.throws(() =>
    parseKboStandings('2026.10.07', [...rows.slice(0, 9), rows[0]], 2026),
  );
  assert.throws(() =>
    parseKboStandings(
      '2026.10.07',
      [['1', '가짜', ...rows[0].slice(2)], ...rows.slice(1)],
      2026,
    ),
  );
});

test('다른 시즌이나 존재하지 않는 날짜를 현재 기준일로 저장하지 않는다', () => {
  assert.throws(() => parseKboStandings('(2025년 10월07일 기준)', rows, 2026));
  assert.throws(() => parseKboStandings('(2026년 02월30일 기준)', rows, 2026));
});

test('빈 숫자를 0으로 해석하지 않는다', () => {
  assert.throws(() =>
    parseKboStandings(
      '2026.10.07',
      [['1', 'KT', '142', '', ...rows[0].slice(4)], ...rows.slice(1)],
      2026,
    ),
  );
});

test('공동 순위와 아직 계산할 수 없는 승률을 보존한다', () => {
  const tiedRows = rows.map(row => [...row]);
  tiedRows[0] = ['1', 'KT', '1', '0', '0', '1', '-', '-'];
  tiedRows[1][0] = '1';
  const result = parseKboStandings('2026.10.07', tiedRows, 2026);
  assert.equal(result.standings[0].winRate, null);
  assert.equal(result.standings[0].gamesBehind, null);
  assert.equal(result.standings[1].rank, 1);
});

test('승률이 높은 팀보다 승패 차이가 큰 팀의 음수 게임차를 보존한다', () => {
  const negativeGapRows = [
    ['1', 'KT', '73', '44', '29', '0', '0.603', '0'],
    ['2', '삼성', '80', '48', '32', '0', '0.600', '-0.5'],
    ...rows.slice(2),
  ];
  const result = parseKboStandings('2026.10.07', negativeGapRows, 2026);
  assert.equal(result.standings[1].rank, 2);
  assert.equal(result.standings[1].gamesBehind, -0.5);
});

test('음수 게임차를 허용해도 음수 경기수와 승패무 기록은 거부한다', () => {
  for (const column of [2, 3, 4, 5]) {
    const invalidRows = rows.map(row => [...row]);
    invalidRows[0][column] = '-1';
    assert.throws(() => parseKboStandings('2026.10.07', invalidRows, 2026));
  }
});
