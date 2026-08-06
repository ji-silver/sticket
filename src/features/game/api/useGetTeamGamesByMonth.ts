import { useQuery } from '@tanstack/react-query';
import { getTeamGamesByMonth } from '../game.service';
import { GAME_KEYS } from './gameKeys';

export function useGetTeamGamesByMonth(teamId: string | null | undefined, yearMonth: string) {
  return useQuery({
    queryKey: GAME_KEYS.teamByMonth(teamId ?? '', yearMonth),
    queryFn: () => {
      const [year, month] = yearMonth.split('-').map(Number);
      return getTeamGamesByMonth(teamId!, year, month);
    },
    enabled: !!teamId && !!yearMonth,
  });
}
