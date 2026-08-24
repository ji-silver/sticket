import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import AppText from '../../components/common/AppText.tsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import { getTodayInKorea } from '../../lib/date.ts';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { useAuth } from '../../features/auth/AuthProvider.tsx';
import type { AttendanceSummary } from '../../features/profile/types.ts';
import { useGetAttendanceSummary } from '../../features/profile/api/useGetAttendanceSummary.ts';
import ProfileSummarySection from './components/ProfileSummarySection.tsx';
import AttendanceStatsSection from './components/AttendanceStatsSection.tsx';
import AccountSettingsSection from './components/AccountSettingsSection.tsx';

type ProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTab'
>;

const EMPTY_ATTENDANCE_SUMMARY: AttendanceSummary = {
  totalGames: 0,
  wins: 0,
  draws: 0,
  losses: 0,
};

const CURRENT_SEASON = Number(getTodayInKorea().slice(0, 4));

function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { profile, signOut, deleteAccount } = useAuth();

  const [isLogoutDialogVisible, setIsLogoutDialogVisible] = useState(false);

  const [isWithdrawalDialogVisible, setIsWithdrawalDialogVisible] =
    useState(false);

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const favoriteTeamId = profile?.favorite_team_id;

  const { data, isLoading: isAttendanceSummaryLoading } =
    useGetAttendanceSummary(favoriteTeamId, CURRENT_SEASON);

  const attendanceSummary = data ?? EMPTY_ATTENDANCE_SUMMARY;

  if (!profile) {
    return null;
  }

  const favoriteTeamName = profile.favorite_team?.name ?? '선택 안 함';

  const favoriteTeamShortName = profile.favorite_team?.short_name ?? '응원팀';
  const seasonTicketSeatName =
    profile.season_ticket_season === CURRENT_SEASON &&
    profile.season_ticket_team_id === profile.favorite_team_id
      ? profile.season_ticket_seat_name
      : null;

  const handleConfirmLogout = async () => {
    setIsLogoutDialogVisible(false);

    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃에 실패했습니다.', error);

      Alert.alert('로그아웃하지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  };

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

        <ProfileSummarySection
          nickname={profile.nickname}
          favoriteTeamName={favoriteTeamName}
          season={CURRENT_SEASON}
          seasonTicketSeatName={seasonTicketSeatName}
          onPressEdit={() => navigation.navigate('ProfileEdit')}
        />

        <AttendanceStatsSection
          favoriteTeamShortName={favoriteTeamShortName}
          attendanceSummary={attendanceSummary}
          isLoading={isAttendanceSummaryLoading}
        />

        <AccountSettingsSection
          onPressLogout={() => setIsLogoutDialogVisible(true)}
          onPressWithdrawal={() => setIsWithdrawalDialogVisible(true)}
        />
      </ScrollView>

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
});
