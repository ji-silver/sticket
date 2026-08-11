import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setTicketPageOrientation } from '../ticket.service.ts';
import type { TicketDiaryOrientation } from '../types.ts';
import { TICKETS_QUERY_KEY } from './useGetTickets.ts';

interface SetTicketPageOrientationParams {
  ticketId: string;
  orientation: TicketDiaryOrientation;
}

export function useSetTicketPageOrientation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, orientation }: SetTicketPageOrientationParams) =>
      setTicketPageOrientation(ticketId, orientation),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY }),
  });
}
