import { useQuery } from '@tanstack/react-query';
import {
  getGamesByDate,
  getLeagueGameDatesByMonth,
  getTeamGamesByMonth,
} from '../game.service';

export const GAME_KEYS = {
  all: ['games'] as const,
  byDate: (date: string) => [...GAME_KEYS.all, 'date', date] as const,
  leagueByMonth: (yearMonth: string) => [...GAME_KEYS.all, 'leagueMonth', yearMonth] as const,
  teamByMonth: (teamId: string, yearMonth: string) => [...GAME_KEYS.all, 'teamMonth', teamId, yearMonth] as const,
};

export function useGamesByDate(date: string) {
  return useQuery({
    queryKey: GAME_KEYS.byDate(date),
    queryFn: () => getGamesByDate(date),
    enabled: !!date,
  });
}

export function useLeagueGameDatesByMonth(yearMonth: string) {
  return useQuery({
    queryKey: GAME_KEYS.leagueByMonth(yearMonth),
    queryFn: () => {
      const [year, month] = yearMonth.split('-').map(Number);
      return getLeagueGameDatesByMonth(year, month);
    },
    enabled: !!yearMonth,
  });
}

export function useTeamGamesByMonth(teamId: string | null | undefined, yearMonth: string) {
  return useQuery({
    queryKey: GAME_KEYS.teamByMonth(teamId ?? '', yearMonth),
    queryFn: () => {
      const [year, month] = yearMonth.split('-').map(Number);
      return getTeamGamesByMonth(teamId!, year, month);
    },
    enabled: !!teamId && !!yearMonth,
  });
}
