import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import { ChevronRight, Info, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import AppText from '../../components/common/AppText.tsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.tsx';
import InlineActionButton from '../../components/common/InlineActionButton.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import { getTodayInKorea } from '../../lib/date.ts';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { useAuth } from '../../features/auth/AuthProvider.tsx';
import { AttendanceSummary } from '../../features/profile/types.ts';
import { useGetAttendanceSummary } from '../../features/profile/api/useGetAttendanceSummary.ts';

type ProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTab'
>;

interface WinRateInfoAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

const EMPTY_ATTENDANCE_SUMMARY: AttendanceSummary = {
  totalGames: 0,
  wins: 0,
  draws: 0,
  losses: 0,
};

const CURRENT_SEASON = Number(getTodayInKorea().slice(0, 4));
const appVersion = DeviceInfo.getVersion();

function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { width: screenWidth } = useWindowDimensions();
  const { profile, signOut, deleteAccount } = useAuth();
  const infoButtonRef = useRef<View>(null);
  const [isLogoutDialogVisible, setIsLogoutDialogVisible] = useState(false);
  const [isWithdrawalDialogVisible, setIsWithdrawalDialogVisible] =
    useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [winRateInfoAnchor, setWinRateInfoAnchor] =
    useState<WinRateInfoAnchor | null>(null);
  const favoriteTeamId = profile?.favorite_team_id;

  const { data, isLoading: isAttendanceSummaryLoading } =
    useGetAttendanceSummary(favoriteTeamId, CURRENT_SEASON);

  const attendanceSummary = data ?? EMPTY_ATTENDANCE_SUMMARY;

  if (!profile) {
    return null;
  }

  const favoriteTeamName = profile.favorite_team?.name ?? '선택 안 함';
  const favoriteTeamShortName = profile.favorite_team?.short_name ?? '응원팀';
  const decidedGames = attendanceSummary.wins + attendanceSummary.losses;
  const winRate =
    decidedGames === 0
      ? null
      : Math.round((attendanceSummary.wins / decidedGames) * 1000) / 10;

  const handleConfirmLogout = async () => {
    setIsLogoutDialogVisible(false);

    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃에 실패했습니다.', error);
      Alert.alert('로그아웃하지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  };

  const handleOpenWinRateInfo = () => {
    infoButtonRef.current?.measureInWindow((x, y, width, height) => {
      setWinRateInfoAnchor({ x, y, width, height });
    });
  };

  const popoverWidth = Math.min(280, screenWidth - 32);
  const popoverLeft = winRateInfoAnchor
    ? Math.min(
        Math.max(winRateInfoAnchor.x + winRateInfoAnchor.width / 2 - 44, 16),
        screenWidth - popoverWidth - 16,
      )
    : 16;

  const handleConfirmWithdrawal = async () => {
    if (isDeletingAccount) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      const didDelete = await deleteAccount();

      if (!didDelete) {
        setIsWithdrawalDialogVisible(false);
      }
    } catch (error) {
      console.error('회원 탈퇴에 실패했습니다.', error);
      setIsWithdrawalDialogVisible(false);
      Alert.alert(
        '회원 탈퇴를 완료하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>프로필</AppText>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileCardTop}>
            <View style={styles.profileTextArea}>
              <AppText style={styles.label}>닉네임</AppText>
              <AppText style={styles.nickname}>{profile.nickname}</AppText>
            </View>

            <InlineActionButton
              label="수정"
              onPress={() => navigation.navigate('ProfileEdit')}
              accessibilityLabel="프로필 수정"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.favoriteSection}>
            <AppText style={styles.label}>응원 구단</AppText>

            <View style={styles.favoriteTeamList}>
              <View style={styles.favoriteTeamRow}>
                <AppText style={styles.sportName}>야구</AppText>
                <AppText style={styles.teamName}>{favoriteTeamName}</AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summarySectionHeader}>
            <AppText style={[styles.sectionTitle, styles.summarySectionTitle]}>
              {favoriteTeamShortName} 직관 성적
            </AppText>

            <AppText style={styles.summaryTotal}>
              {isAttendanceSummaryLoading
                ? '-'
                : `총 ${attendanceSummary.totalGames}경기`}
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
                !isAttendanceSummaryLoading && winRate === null
                  ? styles.winRateEmptyText
                  : null,
              ]}
            >
              {isAttendanceSummaryLoading
                ? '-'
                : winRate === null
                ? '기록 없음'
                : `${winRate}%`}
            </AppText>

            <View style={styles.recordRow}>
              <RecordMetric
                value={
                  isAttendanceSummaryLoading ? '-' : attendanceSummary.wins
                }
                label="승"
                emphasized
              />
              <View style={styles.recordDivider} />
              <RecordMetric
                value={
                  isAttendanceSummaryLoading ? '-' : attendanceSummary.draws
                }
                label="무"
              />
              <View style={styles.recordDivider} />
              <RecordMetric
                value={
                  isAttendanceSummaryLoading ? '-' : attendanceSummary.losses
                }
                label="패"
              />
            </View>
          </View>
        </View>

        <View style={styles.serviceSection}>
          <AppText style={styles.sectionTitle}>서비스 정보</AppText>

          <View style={styles.serviceCard}>
            <Pressable
              style={({ pressed }) => [
                styles.serviceRow,
                pressed && styles.serviceRowPressed,
              ]}
              onPress={() => {}}
              accessibilityRole="button"
            >
              <AppText style={styles.serviceRowText}>이용약관</AppText>
              <ChevronRight
                size={18}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            </Pressable>

            <View style={styles.serviceDivider} />

            <Pressable
              style={({ pressed }) => [
                styles.serviceRow,
                pressed && styles.serviceRowPressed,
              ]}
              onPress={() => {}}
              accessibilityRole="button"
            >
              <AppText style={styles.serviceRowText}>개인정보 처리방침</AppText>
              <ChevronRight
                size={18}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            </Pressable>

            <View style={styles.serviceDivider} />

            <View style={styles.serviceRow}>
              <AppText style={styles.serviceRowText}>앱 버전</AppText>
              <AppText style={styles.serviceValue}>{appVersion}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.accountSection}>
          <AppText style={styles.sectionTitle}>계정 관리</AppText>

          <View style={styles.serviceCard}>
            <Pressable
              style={({ pressed }) => [
                styles.serviceRow,
                pressed && styles.serviceRowPressed,
              ]}
              onPress={() => setIsLogoutDialogVisible(true)}
              accessibilityRole="button"
            >
              <AppText style={styles.serviceRowText}>로그아웃</AppText>
              <LogOut size={18} color={colors.secondary} strokeWidth={2} />
            </Pressable>

            <View style={styles.serviceDivider} />

            <Pressable
              style={({ pressed }) => [
                styles.serviceRow,
                pressed && styles.serviceRowPressed,
              ]}
              onPress={() => setIsWithdrawalDialogVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="회원 탈퇴"
            >
              <AppText style={styles.withdrawalText}>회원 탈퇴</AppText>
              <ChevronRight size={18} color="#D92D20" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

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

      <ConfirmDialog
        visible={isLogoutDialogVisible}
        title="로그아웃할까요?"
        description="다시 이용하려면 로그인이 필요해요."
        confirmLabel="로그아웃"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutDialogVisible(false)}
      />

      <ConfirmDialog
        visible={isWithdrawalDialogVisible}
        title="회원 탈퇴"
        description={
          '정말 회원 탈퇴할까요?\n회원 탈퇴 시 데이터는 복구할 수 없어요.\n\n탈퇴를 원하실 경우 보안을 위해 가입한 계정을 다시 확인합니다.'
        }
        confirmLabel="탈퇴하기"
        confirmTone="destructive"
        isLoading={isDeletingAccount}
        onConfirm={handleConfirmWithdrawal}
        onCancel={() => setIsWithdrawalDialogVisible(false)}
      />
    </SafeAreaView>
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

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 32,
  },
  header: {
    minHeight: 42,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.bold,
  },

  profileCard: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  profileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  profileTextArea: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.secondary,
  },
  nickname: {
    marginTop: 4,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  divider: {
    height: 1,
    marginVertical: 20,
    backgroundColor: colors.border,
  },
  favoriteSection: {
    gap: 10,
  },
  favoriteTeamList: {
    gap: 10,
  },
  favoriteTeamRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sportName: {
    width: 48,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.secondary,
  },
  teamName: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },

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

  serviceSection: {
    marginTop: 32,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  serviceRow: {
    minHeight: 54,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceRowPressed: {
    backgroundColor: colors.background,
  },
  serviceRowText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  serviceValue: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.secondary,
  },
  serviceDivider: {
    height: 1,
    marginHorizontal: 18,
    backgroundColor: colors.border,
  },
  accountSection: {
    marginTop: 32,
  },
  withdrawalText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#D92D20',
  },
});
