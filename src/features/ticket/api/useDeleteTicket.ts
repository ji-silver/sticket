import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTicket } from '../ticket.service';
import { TICKETS_QUERY_KEY } from './useTickets';

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
}
