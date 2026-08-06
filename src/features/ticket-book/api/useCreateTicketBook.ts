import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTicketBook } from '../ticketBook.service';
import { TicketBookCoverPattern, TicketBookSport } from '../types';

export function useCreateTicketBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      sport: TicketBookSport;
      coverPattern: TicketBookCoverPattern;
      coverColor: string;
      coverImageBase64?: string;
    }) => createTicketBook(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketBooks'] });
    },
  });
}
