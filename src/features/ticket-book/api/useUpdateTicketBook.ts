import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTicketBook } from '../ticketBook.service';
import { TicketBookCoverPattern } from '../types';

export function useUpdateTicketBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      ticketBookId: string;
      coverPattern: TicketBookCoverPattern;
      coverColor: string;
      coverImageBase64?: string;
    }) => updateTicketBook(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketBooks'] });
    },
  });
}
