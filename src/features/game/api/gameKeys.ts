export const GAME_KEYS = {
  all: ['games'] as const,
  byDate: (date: string) => [...GAME_KEYS.all, 'date', date] as const,
  leagueByMonth: (yearMonth: string) => [...GAME_KEYS.all, 'leagueMonth', yearMonth] as const,
  teamByMonth: (teamId: string, yearMonth: string) => [...GAME_KEYS.all, 'teamMonth', teamId, yearMonth] as const,
};
