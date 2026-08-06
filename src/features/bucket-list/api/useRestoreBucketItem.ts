import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreBucketItem } from '../bucketList.service';
import { BucketItem } from '../types';

export function useRestoreBucketItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bucketItem: BucketItem) => restoreBucketItem(bucketItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
    },
  });
}
