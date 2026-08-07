import { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Info } from 'lucide-react-native';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import { getTodayInKorea } from '../../../lib/date.ts';
import type { AttendanceSummary } from '../../../features/profile/types.ts';

interface WinRateInfoAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AttendanceStatsSectionProps {
  favoriteTeamShortName: string;
  attendanceSummary: AttendanceSummary;
  isLoading: boolean;
}

const CURRENT_SEASON = Number(getTodayInKorea().slice(0, 4));

function AttendanceStatsSection({
  favoriteTeamShortName,
  attendanceSummary,
  isLoading,
}: AttendanceStatsSectionProps) {
  const { width: screenWidth } = useWindowDimensions();

  const infoButtonRef = useRef<View>(null);

  const [winRateInfoAnchor, setWinRateInfoAnchor] =
    useState<WinRateInfoAnchor | null>(null);

  const decidedGames = attendanceSummary.wins + attendanceSummary.losses;

  const winRate =
    decidedGames === 0
      ? null
      : Math.round((attendanceSummary.wins / decidedGames) * 1000) / 10;

  const handleOpenWinRateInfo = () => {
    infoButtonRef.current?.measureInWindow((x, y, width, height) => {
      setWinRateInfoAnchor({
        x,
        y,
        width,
        height,
      });
    });
  };

  const popoverWidth = Math.min(280, screenWidth - 32);

  const popoverLeft = winRateInfoAnchor
    ? Math.min(
        Math.max(winRateInfoAnchor.x + winRateInfoAnchor.width / 2 - 44, 16),
        screenWidth - popoverWidth - 16,
      )
    : 16;

  return (
    <>
      <View style={styles.summarySection}>
        <View style={styles.summarySectionHeader}>
          <AppText style={[styles.sectionTitle, styles.summarySectionTitle]}>
            {favoriteTeamShortName} 직관 성적
          </AppText>

          <AppText style={styles.summaryTotal}>
            {isLoading ? '-' : `총 ${attendanceSummary.totalGames}경기`}
          </AppText>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.winRateHeader}>
            <AppText style={styles.summaryLabel}>직관 승률</AppText>

            <Pressable
              ref={infoButtonRef}
              style={({ pressed }) => [
                styles.infoButton,
                pressed && styles.infoButtonPressed,
              ]}
              onPress={handleOpenWinRateInfo}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="직관 승률 안내 열기"
            >
              <Info size={14} color={colors.primary} strokeWidth={2.2} />
            </Pressable>
          </View>

          <AppText
            style={[
              styles.winRateText,
              !isLoading && winRate === null ? styles.winRateEmptyText : null,
            ]}
          >
            {isLoading ? '-' : winRate === null ? '기록 없음' : `${winRate}%`}
          </AppText>

          <View style={styles.recordRow}>
            <RecordMetric
              value={isLoading ? '-' : attendanceSummary.wins}
              label="승"
              emphasized
            />

            <View style={styles.recordDivider} />

            <RecordMetric
              value={isLoading ? '-' : attendanceSummary.draws}
              label="무"
            />

            <View style={styles.recordDivider} />

            <RecordMetric
              value={isLoading ? '-' : attendanceSummary.losses}
              label="패"
            />
          </View>
        </View>
      </View>

      <Modal
        visible={winRateInfoAnchor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setWinRateInfoAnchor(null)}
      >
        <View style={styles.popoverLayer} accessibilityViewIsModal>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setWinRateInfoAnchor(null)}
            accessibilityRole="button"
            accessibilityLabel="직관 승률 안내 닫기"
          />

          {winRateInfoAnchor ? (
            <View
              accessible
              accessibilityLabel={`현재는 ${CURRENT_SEASON}시즌 응원팀의 종료 경기 기준이며, 무승부는 승률에서 제외돼요.`}
              style={[
                styles.winRatePopover,
                {
                  width: popoverWidth,
                  left: popoverLeft,
                  top: winRateInfoAnchor.y + winRateInfoAnchor.height + 8,
                },
              ]}
            >
              <View
                style={[
                  styles.popoverArrow,
                  {
                    left:
                      winRateInfoAnchor.x +
                      winRateInfoAnchor.width / 2 -
                      popoverLeft -
                      6,
                  },
                ]}
              />

              <AppText style={styles.popoverText}>
                {`현재는 ${CURRENT_SEASON}시즌 응원팀의 종료 경기 기준이며, 무승부는 승률에서 제외돼요.`}
              </AppText>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

function RecordMetric({
  value,
  label,
  emphasized = false,
}: {
  value: number | string;
  label: string;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.recordMetric}>
      <AppText
        style={[styles.recordValue, emphasized && styles.recordValueEmphasized]}
      >
        {value}
      </AppText>

      <AppText style={styles.recordLabel}>{label}</AppText>
    </View>
  );
}

export default AttendanceStatsSection;

const styles = StyleSheet.create({
  summarySection: {
    marginTop: 24,
  },

  summarySectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  summarySectionTitle: {
    marginBottom: 0,
  },

  summaryTotal: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  summaryCard: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },

  winRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoButtonPressed: {
    opacity: 0.55,
  },

  summaryLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },

  winRateText: {
    marginTop: 2,
    fontSize: 38,
    lineHeight: 46,
    fontFamily: fonts.black,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  winRateEmptyText: {
    fontSize: 20,
    lineHeight: 46,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  recordRow: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  recordMetric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },

  recordValue: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  recordValueEmphasized: {
    color: colors.primary,
  },

  recordLabel: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  recordDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
  },

  popoverLayer: {
    flex: 1,
  },

  winRatePopover: {
    position: 'absolute',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.text,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },

  popoverArrow: {
    position: 'absolute',
    top: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.text,
  },

  popoverText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.onPrimary,
  },
});
