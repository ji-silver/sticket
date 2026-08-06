import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTicketOriginalPhoto } from '../ticket.service';

export function useUpdateTicketOriginalPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, photoBase64 }: { ticketId: string; photoBase64: string }) =>
      updateTicketOriginalPhoto(ticketId, photoBase64),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
