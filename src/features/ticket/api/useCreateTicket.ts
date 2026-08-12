import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTicket } from '../ticket.service';
import { TICKET_BOOKS_QUERY_KEY } from '../../ticket-book/api/useGetTicketBooks';
import { TICKETS_QUERY_KEY } from './useGetTickets';

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TICKET_BOOKS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['attendanceSummary'] }),
      ]),
  });
}
