import type { KboStanding } from './types.ts';

// 수집기와 앱이 같은 구단 ID와 검증 규칙을 사용해 부분 수집을 정상 순위로 오인하지 않는다.
export const KBO_TEAM_NAMES: Record<string, string> = {
  kt: 'KT',
  samsung: '삼성',
  kia: 'KIA',
  lg: 'LG',
  doosan: '두산',
  ssg: 'SSG',
  nc: 'NC',
  lotte: '롯데',
  hanwha: '한화',
  kiwoom: '키움',
};

export function validateStandingsDate(date: string, season: number): void {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number(date.slice(0, 4)) !== season ||
    !Number.isInteger(season) ||
    season < 1982 ||
    season > 2100
  ) {
    throw new Error('KBO 순위 기준일과 시즌이 일치하지 않습니다.');
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error('KBO 순위 기준일이 올바르지 않습니다.');
  }
}

export function parseStandings(value: unknown): KboStanding[] {
  if (!Array.isArray(value) || value.length !== 10) {
    throw new Error('KBO 순위는 10개 구단이 모두 있어야 합니다.');
  }
  const teamIds = new Set<string>();
  const standings = value.map((row: unknown) => {
    if (!row || typeof row !== 'object') {
      throw new Error('KBO 순위 행이 올바르지 않습니다.');
    }
    const { teamId, rank, played, wins, losses, draws, winRate, gamesBehind } =
      row as Record<string, unknown>;
    if (
      typeof teamId !== 'string' ||
      !Object.hasOwn(KBO_TEAM_NAMES, teamId) ||
      teamIds.has(teamId)
    ) {
      throw new Error('KBO 순위에 알 수 없거나 중복된 구단이 있습니다.');
    }
    teamIds.add(teamId);
    // 팀별 경기 수가 다르면 승률 순위와 승패 차이가 엇갈려 게임차가 음수일 수 있다.
    if (
      !isIntegerInRange(rank, 1, 10) ||
      !isIntegerInRange(played, 0, 200) ||
      !isIntegerInRange(wins, 0, 200) ||
      !isIntegerInRange(losses, 0, 200) ||
      !isIntegerInRange(draws, 0, 200) ||
      played !== wins + losses + draws ||
      (winRate !== null &&
        (typeof winRate !== 'number' ||
          !Number.isFinite(winRate) ||
          winRate < 0 ||
          winRate > 1)) ||
      (gamesBehind !== null &&
        (typeof gamesBehind !== 'number' ||
          !Number.isFinite(gamesBehind)))
    ) {
      throw new Error('KBO 순위의 성적 수치가 올바르지 않습니다.');
    }
    // 승패가 없으면 공식 표가 0.000을 주더라도 아직 계산할 수 없는 승률이다.
    if (
      wins + losses > 0 &&
      (winRate === null || Math.abs(winRate - wins / (wins + losses)) > 0.001)
    ) {
      throw new Error('KBO 승률이 승패 기록과 일치하지 않습니다.');
    }
    return {
      teamId,
      teamName: KBO_TEAM_NAMES[teamId],
      rank,
      played,
      wins,
      losses,
      draws,
      winRate: wins + losses === 0 ? null : winRate,
      gamesBehind,
    };
  });
  // 동률은 같은 순위를 유지하고, 같은 순위 안에서는 공식 표의 순서를 보존한다.
  return standings.sort((a, b) => a.rank - b.rank);
}

function isIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}
