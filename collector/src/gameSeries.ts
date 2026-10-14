import type { KboPostseasonType } from './types.ts';

export function parseKboPostseasonType(value: unknown): KboPostseasonType | null {
  if (typeof value !== 'string') return null;

  // 일정 비고의 '준PO 1차전'과 경기 목록의 '준PO1'은 같은 공식 단계 코드다.
  // 이동일이나 '준PO 승리팀' 같은 안내 문구를 경기 단계로 오인하지 않는다.
  const code = value.trim().match(
    /^(WC|준PO|PO|KS)\s*[1-9]\d*(?:\s*차전)?(?:\s|$)/,
  )?.[1];

  switch (code) {
    case 'WC': return 'WILDCARD';
    case '준PO': return 'SEMI_PLAYOFF';
    case 'PO': return 'PLAYOFF';
    case 'KS': return 'KOREAN_SERIES';
    default: return null;
  }
}
