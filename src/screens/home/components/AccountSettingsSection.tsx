import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';
import DeviceInfo from 'react-native-device-info';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { RootStackParamList } from '../../../navigation/RootStackNavigator.tsx';

interface AccountSettingsSectionProps {
  onPressLogout: () => void;
  onPressWithdrawal: () => void;
  disabled?: boolean;
}

const appVersion = DeviceInfo.getVersion();
const DOCUMENTS = [
  {
    title: '이용약관',
    uri: 'https://amenable-colby-ae6.notion.site/3b6f2bd020d08050b594d22630e4a866',
  },
  {
    title: '개인정보 처리방침',
    uri: 'https://amenable-colby-ae6.notion.site/3b5f2bd020d0803da252e68a09189ae5',
  },
];
const SUPPORT_EMAIL_URL = `mailto:hello.appworks@gmail.com?subject=${encodeURIComponent(
  '[스티켓 문의]',
)}`;
const APP_REVIEW_URL =
  'https://apps.apple.com/app/id6800050133?action=write-review';

function AccountSettingsSection({
  onPressLogout,
  onPressWithdrawal,
  disabled = false,
}: AccountSettingsSectionProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePressReview = async () => {
    try {
      await Linking.openURL(APP_REVIEW_URL);
    } catch {
      Alert.alert('App Store를 열지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  };

  const handlePressSupport = async () => {
    try {
      await Linking.openURL(SUPPORT_EMAIL_URL);
    } catch {
      Alert.alert(
        '메일 앱을 열 수 없습니다',
        'hello.appworks@gmail.com으로 문의해 주세요.',
      );
    }
  };

  return (
    <>
      <View>
        <AppText style={styles.sectionTitle} accessibilityRole="header">
          서비스 정보
        </AppText>
        <View style={styles.list}>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              styles.divider,
              pressed && styles.pressed,
            ]}
            onPress={handlePressReview}
            accessibilityRole="button"
            accessibilityLabel="앱 평가하기"
            accessibilityHint="App Store의 리뷰 작성 화면을 엽니다"
          >
            <AppText style={styles.rowText}>앱 평가하기</AppText>
            <ChevronRight
              size={18}
              color={colors.textSecondary}
              strokeWidth={1.8}
            />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              styles.divider,
              pressed && styles.pressed,
            ]}
            onPress={handlePressSupport}
            accessibilityRole="button"
            accessibilityLabel="문의 및 피드백"
          >
            <AppText style={styles.rowText}>문의 및 피드백</AppText>
            <ChevronRight
              size={18}
              color={colors.textSecondary}
              strokeWidth={1.8}
            />
          </Pressable>
          {DOCUMENTS.map((document, index) => (
            <Pressable
              key={document.title}
              style={({ pressed }) => [
                styles.row,
                index < DOCUMENTS.length - 1 && styles.divider,
                pressed && styles.pressed,
              ]}
              onPress={() => navigation.navigate('Document', document)}
              accessibilityRole="button"
            >
              <AppText style={styles.rowText}>{document.title}</AppText>
              <ChevronRight
                size={18}
                color={colors.textSecondary}
                strokeWidth={1.8}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.accountSection}>
        <AppText style={styles.sectionTitle} accessibilityRole="header">
          계정 관리
        </AppText>
        <View style={styles.list}>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              styles.divider,
              pressed && styles.pressed,
              disabled && styles.disabled,
            ]}
            onPress={onPressLogout}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
          >
            <AppText style={styles.rowText}>로그아웃</AppText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              pressed && styles.pressed,
              disabled && styles.disabled,
            ]}
            onPress={onPressWithdrawal}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="회원 탈퇴"
            accessibilityState={{ disabled }}
          >
            <AppText style={[styles.rowText, styles.withdrawalText]}>
              회원 탈퇴
            </AppText>
          </Pressable>
        </View>
      </View>
      <AppText style={styles.version}>{`앱 버전 ${appVersion}`}</AppText>
    </>
  );
}

export default AccountSettingsSection;

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 12,
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  list: {
    borderRadius: 18,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  row: {
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.background },
  disabled: { opacity: 0.5 },
  accountSection: { marginTop: 32 },
  withdrawalText: { color: colors.error },
  version: {
    marginTop: 24,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
