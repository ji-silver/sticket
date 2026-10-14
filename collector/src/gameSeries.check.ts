import assert from 'node:assert/strict';
import test from 'node:test';
import { parseKboPostseasonType } from './gameSeries.ts';

for (const [source, expected] of [
  ['WC 1차전', 'WILDCARD'],
  ['준PO 2차전', 'SEMI_PLAYOFF'],
  ['PO 5차전', 'PLAYOFF'],
  ['KS 1차전', 'KOREAN_SERIES'],
  ['WC1', 'WILDCARD'],
  ['준PO2', 'SEMI_PLAYOFF'],
  ['PO5', 'PLAYOFF'],
  ['KS1', 'KOREAN_SERIES'],
  [' 준PO 3차전 우천취소 ', 'SEMI_PLAYOFF'],
] as const) {
  test(`공식 경기 구분 ${source}를 ${expected}로 분류한다`, () => {
    assert.equal(parseKboPostseasonType(source), expected);
  });
}

for (const source of [undefined, null, '', '-', '이동일', '준PO 승리팀', 'WC 0차전']) {
  test(`단계가 확인되지 않은 정보(${source})는 분류하지 않는다`, () => {
    assert.equal(parseKboPostseasonType(source), null);
  });
}
