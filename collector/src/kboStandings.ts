import {
  KBO_TEAM_NAMES,
  parseStandings,
  validateStandingsDate,
} from '../../src/features/standings/standings.ts';
import type { KboStandingsSnapshot } from '../../src/features/standings/types.ts';

export function parseKboStandings(
  dateText: string,
  rows: string[][],
  season: number,
): KboStandingsSnapshot {
  const dateMatch = dateText.match(/(\d{4})[년.]\s*(\d{1,2})[월.]\s*(\d{1,2})/);
  if (!dateMatch) throw new Error('KBO 순위 기준일을 찾지 못했습니다.');
  const asOfDate = `${dateMatch[1]}-${dateMatch[2].padStart(
    2,
    '0',
  )}-${dateMatch[3].padStart(2, '0')}`;
  validateStandingsDate(asOfDate, season);

  const standings = parseStandings(
    rows.map(cells => {
      const [rank, name, played, wins, losses, draws, winRate, gamesBehind] =
        cells;
      const teamId = Object.keys(KBO_TEAM_NAMES).find(
        id => KBO_TEAM_NAMES[id] === name?.trim(),
      );
      return {
        teamId,
        rank: parseNumber(rank),
        played: parseNumber(played),
        wins: parseNumber(wins),
        losses: parseNumber(losses),
        draws: parseNumber(draws),
        winRate: winRate?.trim() === '-' ? null : parseNumber(winRate),
        gamesBehind:
          gamesBehind?.trim() === '-' ? null : parseNumber(gamesBehind),
      };
    }),
  );
  return { season, asOfDate, standings };
}

function parseNumber(text: string | undefined): number {
  // Number('')가 0이 되는 것을 막아 페이지 구조 변경이나 빈 셀을 수집 실패로 처리한다.
  // 게임차의 음수는 허용하고, 경기수·승패무의 음수는 공유 검증에서 거부한다.
  if (text === undefined || !/^-?\d+(?:\.\d+)?$/.test(text.trim())) {
    throw new Error('KBO 순위에 비어 있거나 잘못된 숫자가 있습니다.');
  }
  return Number(text.trim());
}
