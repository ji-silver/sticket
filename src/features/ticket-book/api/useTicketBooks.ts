import { useQuery } from '@tanstack/react-query';
import { getTicketBooks } from '../ticketBook.service';

export const TICKET_BOOKS_QUERY_KEY = ['ticketBooks'];

export function useTicketBooks() {
  return useQuery({
    queryKey: TICKET_BOOKS_QUERY_KEY,
    queryFn: getTicketBooks,
  });
}
