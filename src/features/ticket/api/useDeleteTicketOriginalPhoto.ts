import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTicketOriginalPhoto } from '../ticket.service';

export function useDeleteTicketOriginalPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => deleteTicketOriginalPhoto(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
