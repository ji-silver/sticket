import { useQuery } from '@tanstack/react-query';
import { getGamesByDate } from '../game.service';
import { GAME_KEYS } from './gameKeys';

export function useGetGamesByDate(date: string) {
  return useQuery({
    queryKey: GAME_KEYS.byDate(date),
    queryFn: () => getGamesByDate(date),
    enabled: !!date,
  });
}
