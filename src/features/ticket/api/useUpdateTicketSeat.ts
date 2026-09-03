import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTicketSeat } from '../ticket.service';

export function useUpdateTicketSeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      seatName,
      seatDetail,
    }: {
      ticketId: string;
      seatName: string;
      seatDetail: string;
    }) => updateTicketSeat(ticketId, seatName, seatDetail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
