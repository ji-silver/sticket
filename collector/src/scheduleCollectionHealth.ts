interface ScheduleCollectionHealth {
  shouldRequireGames: boolean;
  rawRowCount: number;
  parsedGameCount: number;
}

export function assertScheduleCollectionHealth(
  health: ScheduleCollectionHealth,
) {
  if (!health.shouldRequireGames) {
    return;
  }

  if (health.rawRowCount === 0) {
    throw new Error(
      'KBO 월간 경기 일정이 한 건도 수집되지 않았습니다. KBO 페이지 응답을 확인해 주세요.',
    );
  }

  if (health.parsedGameCount === 0) {
    throw new Error(
      'KBO 월간 경기 행을 분석하지 못했습니다. KBO 페이지 구조를 확인해 주세요.',
    );
  }
}
