import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTicket } from '../ticket.service';
import { TICKETS_QUERY_KEY } from './useTickets';

export function useAddTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
}
