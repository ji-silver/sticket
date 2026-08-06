import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTicketRating } from '../ticket.service';

export function useUpdateTicketRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, rating }: { ticketId: string; rating: number | null }) =>
      updateTicketRating(ticketId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
