import { useQuery } from '@tanstack/react-query';
import { getTickets } from '../ticket.service';

export const TICKETS_QUERY_KEY = ['tickets'];

export function useGetTickets() {
  return useQuery({
    queryKey: TICKETS_QUERY_KEY,
    queryFn: getTickets,
  });
}
