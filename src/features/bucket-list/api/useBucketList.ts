import { useQuery } from '@tanstack/react-query';
import { getBucketItems } from '../bucketList.service';

export const BUCKET_LIST_QUERY_KEY = (ticketBookIds: string[]) => ['bucketList', ticketBookIds];

export function useBucketList(ticketBookIds: string[]) {
  return useQuery({
    queryKey: BUCKET_LIST_QUERY_KEY(ticketBookIds),
    queryFn: () => getBucketItems(ticketBookIds),
    enabled: ticketBookIds.length > 0,
  });
}
