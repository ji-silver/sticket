import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import type { UserProfile } from '../../../features/auth/auth.types.ts';
import { useGetAttendanceSummary } from '../../../features/profile/api/useGetAttendanceSummary.ts';
import type { AttendanceSummary } from '../../../features/profile/types.ts';
import { getTodayInKorea } from '../../../lib/date.ts';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import AttendanceStatsSection from './AttendanceStatsSection.tsx';

const EMPTY_ATTENDANCE_SUMMARY: AttendanceSummary = {
  totalGames: 0,
  wins: 0,
  draws: 0,
  losses: 0,
};

function BaseballProfileSection({ profile }: { profile: UserProfile }) {
  const currentSeason = Number(getTodayInKorea().slice(0, 4));
  const summaryQuery = useGetAttendanceSummary(
    profile.favorite_team_id,
    currentSeason,
  );

  const seasonTicketSeatName =
    profile.season_ticket_season === currentSeason &&
    profile.season_ticket_team_id === profile.favorite_team_id
      ? profile.season_ticket_seat_name
      : null;

  return (
    <View style={styles.section}>
      <AppText style={styles.title} accessibilityRole="header">
        야구
      </AppText>
      <AppText style={styles.teamName}>{profile.favorite_team?.name}</AppText>
      <View style={styles.seatRow}>
        <View style={styles.seatInfo}>
          <AppText style={styles.seatLabel}>시즌권 좌석</AppText>
          <AppText style={styles.seatName}>
            {seasonTicketSeatName ?? '미등록'}
          </AppText>
        </View>
      </View>
      <AttendanceStatsSection
        season={currentSeason}
        attendanceSummary={summaryQuery.data ?? EMPTY_ATTENDANCE_SUMMARY}
        isLoading={summaryQuery.isLoading}
        isError={summaryQuery.isError}
        isRetrying={summaryQuery.isFetching}
        onRetry={() => summaryQuery.refetch()}
      />
    </View>
  );
}

export default BaseballProfileSection;

const styles = StyleSheet.create({
  section: { marginTop: 32 },
  title: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  teamName: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 22,
    lineHeight: 30,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  seatRow: {
    minHeight: 76,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  seatInfo: { flex: 1, minWidth: 0, gap: 4 },
  seatLabel: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  seatName: { fontSize: 15, lineHeight: 22, color: colors.text },
});
