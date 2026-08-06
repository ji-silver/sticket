import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBucketItem } from '../bucketList.service';

export function useDeleteBucketItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bucketItemId: string) => deleteBucketItem(bucketItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
    },
  });
}
