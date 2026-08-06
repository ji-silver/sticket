import { useQuery } from '@tanstack/react-query';
import { getLeagueGameDatesByMonth } from '../game.service';
import { GAME_KEYS } from './gameKeys';

export function useGetLeagueGameDatesByMonth(yearMonth: string) {
  return useQuery({
    queryKey: GAME_KEYS.leagueByMonth(yearMonth),
    queryFn: () => {
      const [year, month] = yearMonth.split('-').map(Number);
      return getLeagueGameDatesByMonth(year, month);
    },
    enabled: !!yearMonth,
  });
}
