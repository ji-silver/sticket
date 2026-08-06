import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTicketSeat } from '../ticket.service';

export function useUpdateTicketSeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, seatName }: { ticketId: string; seatName: string }) =>
      updateTicketSeat(ticketId, seatName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
