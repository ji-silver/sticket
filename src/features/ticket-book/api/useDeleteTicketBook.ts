import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTicketBook } from '../ticketBook.service';

export function useDeleteTicketBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketBookId: string) => deleteTicketBook(ticketBookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketBooks'] });
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
    },
  });
}
