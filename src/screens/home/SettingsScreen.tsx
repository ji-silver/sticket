import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ConfirmDialog from '../../components/common/ConfirmDialog.tsx';
import ResponsiveContent from '../../components/common/ResponsiveContent.tsx';
import ScreenHeader from '../../components/common/ScreenHeader.tsx';
import { useAuth } from '../../features/auth/AuthProvider.tsx';
import { colors } from '../../styles/colors.ts';
import AccountSettingsSection from './components/AccountSettingsSection.tsx';

function SettingsScreen() {
  const navigation = useNavigation();
  const { signOut, deleteAccount } = useAuth();
  const [dialog, setDialog] = useState<'logout' | 'withdrawal' | null>(null);
  const [isAccountActionPending, setIsAccountActionPending] = useState(false);
  const accountActionPendingRef = useRef(false);

  const handleConfirmLogout = async () => {
    // state가 화면에 반영되기 전 연속 입력 차단 및 탈퇴, 로그아웃의 동시 실행을 막기
    if (accountActionPendingRef.current) {
      return;
    }
    accountActionPendingRef.current = true;
    setIsAccountActionPending(true);
    setDialog(null);

    try {
      await signOut();
      // 인증 상태에 따른 화면 전환은 RootStackNavigator가 처리
    } catch (error) {
      console.error('로그아웃에 실패했습니다.', error);
      Alert.alert('로그아웃하지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      accountActionPendingRef.current = false;
      setIsAccountActionPending(false);
    }
  };

  const handleConfirmWithdrawal = async () => {
    if (accountActionPendingRef.current) {
      return;
    }
    accountActionPendingRef.current = true;
    setIsAccountActionPending(true);

    try {
      // 재인증을 취소하면 false가 반환되므로, 계정을 지우거나 화면을 이동하지 않고 확인창만 닫기
      const didDelete = await deleteAccount();
      if (!didDelete) {
        setDialog(null);
      }
    } catch (error) {
      console.error('회원 탈퇴에 실패했습니다.', error);
      setDialog(null);
      Alert.alert(
        '회원 탈퇴를 완료하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      accountActionPendingRef.current = false;
      setIsAccountActionPending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="설정" onPressBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <ResponsiveContent>
          <AccountSettingsSection
            onPressLogout={() => setDialog('logout')}
            onPressWithdrawal={() => setDialog('withdrawal')}
            disabled={isAccountActionPending}
          />
        </ResponsiveContent>
      </ScrollView>

      <ConfirmDialog
        visible={dialog === 'logout'}
        title="로그아웃할까요?"
        description="다시 이용하려면 로그인이 필요해요."
        confirmLabel="로그아웃"
        onConfirm={handleConfirmLogout}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        visible={dialog === 'withdrawal'}
        title="회원 탈퇴"
        description={
          '정말 회원 탈퇴할까요?\n회원 탈퇴 시 데이터는 복구할 수 없어요.\n\n탈퇴를 원하실 경우 보안을 위해 가입한 계정을 다시 확인합니다.'
        }
        confirmLabel="탈퇴하기"
        confirmTone="destructive"
        isLoading={isAccountActionPending}
        onConfirm={handleConfirmWithdrawal}
        onCancel={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

export default SettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 },
});
