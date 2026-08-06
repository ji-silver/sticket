import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTicketMemo } from '../ticket.service';

export function useUpdateTicketMemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, memo }: { ticketId: string; memo: string }) =>
      updateTicketMemo(ticketId, memo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
