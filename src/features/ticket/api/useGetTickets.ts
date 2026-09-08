import { useQuery } from '@tanstack/react-query';
import {
  getTicketById,
  getTicketGameSnapshot,
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

export function useGetTicket(ticketId: string) {
  return useQuery({
    queryKey: [...TICKETS_QUERY_KEY, 'detail', ticketId],
    queryFn: () => getTicketById(ticketId),
  });
}

export function useGetTicketGameSnapshot(ticketId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...TICKETS_QUERY_KEY, ticketId, 'game'],
    queryFn: () => getTicketGameSnapshot(ticketId),
    enabled,
    refetchInterval: query => {
      const status = query.state.data?.gameStatus;

      return status === 'SCHEDULED' || status === 'IN_PROGRESS'
        ? 5 * 60 * 1000
        : false;
    },
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
