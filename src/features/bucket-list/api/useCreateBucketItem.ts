import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBucketItem } from '../bucketList.service';

export function useCreateBucketItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketBookId, title }: { ticketBookId: string; title: string }) =>
      createBucketItem(ticketBookId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
    },
  });
}
