import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import AppButton from '../../../components/common/AppButton.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { AttendanceSummary } from '../../../features/profile/types.ts';

interface AttendanceStatsSectionProps {
  season: number;
  attendanceSummary: AttendanceSummary;
  isLoading: boolean;
  isError: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}

function AttendanceStatsSection({
  season,
  attendanceSummary,
  isLoading,
  isError,
  isRetrying,
  onRetry,
}: AttendanceStatsSectionProps) {
  const decidedGames = attendanceSummary.wins + attendanceSummary.losses;
  // 야구의 무승부는 직관 횟수에는 포함하지만 승률의 분모에서는 제외한다.
  // 종료 경기가 전부 무승부라면 0%로 오해하지 않도록 '집계 전'으로 표시한다.
  const winRate =
    decidedGames === 0
      ? null
      : Math.round((attendanceSummary.wins / decidedGames) * 1000) / 10;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText style={styles.title} accessibilityRole="header">
          야구 직관 성적
        </AppText>
        <AppText style={styles.season}>{season} 시즌</AppText>
      </View>

      {/* 실패, 조회 중, 실제 빈 기록을 구분해 아직 모르는 성적을 0경기로 표시하지 않는다. */}
      {isError ? (
        <View>
          <AppText style={styles.message}>
            직관 성적을 불러오지 못했어요.
          </AppText>
          <AppButton
            onPress={onRetry}
            disabled={isRetrying}
            accessibilityLabel="직관 성적 다시 불러오기"
            style={styles.retryButton}
          >
            <AppText style={styles.retryText}>
              {isRetrying ? '불러오는 중…' : '다시 불러오기'}
            </AppText>
          </AppButton>
        </View>
      ) : isLoading ? (
        <AppText
          style={styles.message}
          accessibilityLabel="직관 성적 불러오는 중"
          accessibilityState={{ busy: true }}
        >
          성적을 불러오고 있어요.
        </AppText>
      ) : (
        <View>
          <View style={styles.scoreboard}>
            <View style={styles.metrics}>
              <View style={styles.winRateMetric}>
                <AppText style={styles.metricLabel}>직관 승률</AppText>
                <AppText
                  style={[
                    styles.winRate,
                    winRate === null && styles.pendingRate,
                  ]}
                  accessibilityLabel={
                    winRate === null ? '직관 승률 집계 전' : undefined
                  }
                >
                  {winRate === null ? '집계 전' : `${winRate}%`}
                </AppText>
              </View>
              <RecordMetric value={attendanceSummary.wins} label="승" />
              <RecordMetric value={attendanceSummary.draws} label="무" />
              <RecordMetric value={attendanceSummary.losses} label="패" />
            </View>
            <AppText style={styles.gameCount}>
              {`응원팀 종료 경기 ${attendanceSummary.totalGames}경기`}
            </AppText>
          </View>
          <AppText style={styles.caption}>
            {attendanceSummary.totalGames === 0
              ? '이번 시즌 응원팀의 종료 경기 기록이 없어요.'
              : '무승부는 승률에서 제외돼요.'}
          </AppText>
        </View>
      )}
    </View>
  );
}

function RecordMetric({ value, label }: { value: number; label: string }) {
  return (
    <View
      style={styles.metric}
      accessible
      accessibilityLabel={`${value}${label}`}
    >
      <AppText style={styles.metricLabel}>{label}</AppText>
      <AppText style={styles.recordValue}>{value}</AppText>
    </View>
  );
}

export default AttendanceStatsSection;

const styles = StyleSheet.create({
  section: { marginTop: 28 },
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  season: { fontSize: 13, color: colors.textSecondary },
  scoreboard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  metrics: { flexDirection: 'row', alignItems: 'stretch' },
  winRateMetric: {
    flex: 1.6,
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    gap: 8,
  },
  metric: { flex: 1, alignItems: 'center', gap: 8 },
  metricLabel: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  winRate: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: fonts.bold,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  pendingRate: { fontSize: 18, fontFamily: fonts.regular },
  recordValue: {
    fontSize: 26,
    lineHeight: 36,
    fontFamily: fonts.bold,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  gameCount: {
    marginTop: 20,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  caption: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  message: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 8,
  },
  retryText: { fontSize: 14, fontFamily: fonts.bold, color: colors.primary },
});
