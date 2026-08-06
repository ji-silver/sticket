import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBucketItemCompleted } from '../bucketList.service';

export function useUpdateBucketItemCompleted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bucketItemId, isCompleted }: { bucketItemId: string; isCompleted: boolean }) =>
      updateBucketItemCompleted(bucketItemId, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
    },
  });
}
