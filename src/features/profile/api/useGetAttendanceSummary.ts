import { useQuery } from '@tanstack/react-query';
import { getAttendanceSummary } from '../profile.service';

export const ATTENDANCE_SUMMARY_QUERY_KEY = (teamId: string, season: number) => ['attendanceSummary', teamId, season];

export function useGetAttendanceSummary(teamId: string | undefined | null, season: number) {
  return useQuery({
    queryKey: ATTENDANCE_SUMMARY_QUERY_KEY(teamId ?? '', season),
    queryFn: () => {
      if (!teamId) throw new Error('teamId is required');
      return getAttendanceSummary(teamId, season);
    },
    enabled: !!teamId,
  });
}
