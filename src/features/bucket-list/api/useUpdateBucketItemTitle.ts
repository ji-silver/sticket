import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBucketItemTitle } from '../bucketList.service';

export function useUpdateBucketItemTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bucketItemId, title }: { bucketItemId: string; title: string }) =>
      updateBucketItemTitle(bucketItemId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
    },
  });
}
