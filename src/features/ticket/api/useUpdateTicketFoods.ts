import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTicketFoods } from '../ticket.service';

export function useUpdateTicketFoods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, foods }: { ticketId: string; foods: string[] }) =>
      updateTicketFoods(ticketId, foods),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
