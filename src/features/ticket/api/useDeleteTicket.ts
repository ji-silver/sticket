import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTicket } from '../ticket.service';
import { TICKET_BOOKS_QUERY_KEY } from '../../ticket-book/api/useGetTicketBooks';
import { TICKETS_QUERY_KEY } from './useGetTickets';

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TICKET_BOOKS_QUERY_KEY }),
      ]),
  });
}
