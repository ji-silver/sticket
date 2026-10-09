import { Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAppUpdatePolicy } from '../appUpdate.service';

export function useAppUpdatePolicy() {
  const enabled = Platform.OS === 'ios';
  return useQuery({
    queryKey: ['app-update-policy', 'ios'],
    queryFn: ({ signal }) => getAppUpdatePolicy('ios', signal),
    enabled,
    retry: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}
