import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTicket } from '../ticket.service';
import { TICKETS_QUERY_KEY } from './useGetTickets';

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
}
