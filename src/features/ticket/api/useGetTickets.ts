import { useQuery } from '@tanstack/react-query';
import {
  getTicketSeasonSummaries,
  getTickets,
  getTicketsBySeason,
} from '../ticket.service';

export const TICKETS_QUERY_KEY = ['tickets'];

export function useGetTickets() {
  return useQuery({
    queryKey: TICKETS_QUERY_KEY,
    queryFn: getTickets,
  });
}

export function useGetTicketSeasonSummaries() {
  return useQuery({
    queryKey: [...TICKETS_QUERY_KEY, 'seasons'],
    queryFn: getTicketSeasonSummaries,
  });
}

export function useGetTicketsBySeason(season: number | null) {
  return useQuery({
    queryKey: [...TICKETS_QUERY_KEY, 'season', season],
    queryFn: () => getTicketsBySeason(season!),
    enabled: season !== null,
  });
}
