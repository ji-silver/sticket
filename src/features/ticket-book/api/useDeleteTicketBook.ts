import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TICKETS_QUERY_KEY } from '../../ticket/api/useGetTickets';
import { deleteTicketBook } from '../ticketBook.service';
import { TICKET_BOOKS_QUERY_KEY } from './useGetTicketBooks';

export function useDeleteTicketBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketBookId: string) => deleteTicketBook(ticketBookId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: TICKET_BOOKS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['bucketList'] }),
        queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['attendanceSummary'] }),
      ]),
  });
}
