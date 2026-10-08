import { useQuery } from '@tanstack/react-query';
import { getKboStandings } from '../standings.service';

export function useGetKboStandings(season: number, enabled: boolean) {
  return useQuery({
    queryKey: ['kbo-standings', season],
    queryFn: () => getKboStandings(season),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
