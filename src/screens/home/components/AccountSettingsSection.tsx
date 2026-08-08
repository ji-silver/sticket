import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, LogOut } from 'lucide-react-native';
import DeviceInfo from 'react-native-device-info';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { RootStackParamList } from '../../../navigation/RootStackNavigator.tsx';

interface AccountSettingsSectionProps {
  onPressLogout: () => void;
  onPressWithdrawal: () => void;
}

const appVersion = DeviceInfo.getVersion();
const TERMS_OF_SERVICE_URL =
  'https://amenable-colby-ae6.notion.site/3b6f2bd020d08050b594d22630e4a866';
const PRIVACY_POLICY_URL =
  'https://amenable-colby-ae6.notion.site/3b5f2bd020d0803da252e68a09189ae5';

function AccountSettingsSection({
  onPressLogout,
  onPressWithdrawal,
}: AccountSettingsSectionProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <>
      <View style={styles.serviceSection}>
        <AppText style={styles.sectionTitle}>서비스 정보</AppText>

        <View style={styles.serviceCard}>
          <Pressable
            style={({ pressed }) => [
              styles.serviceRow,
              pressed && styles.serviceRowPressed,
            ]}
            onPress={() =>
              navigation.navigate('Document', {
                title: '이용약관',
                uri: TERMS_OF_SERVICE_URL,
              })
            }
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
            onPress={() =>
              navigation.navigate('Document', {
                title: '개인정보 처리방침',
                uri: PRIVACY_POLICY_URL,
              })
            }
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
            onPress={onPressLogout}
            accessibilityRole="button"
          >
            <AppText style={styles.serviceRowText}>로그아웃</AppText>

            <LogOut size={18} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>

          <View style={styles.serviceDivider} />

          <Pressable
            style={({ pressed }) => [
              styles.serviceRow,
              pressed && styles.serviceRowPressed,
            ]}
            onPress={onPressWithdrawal}
            accessibilityRole="button"
            accessibilityLabel="회원 탈퇴"
          >
            <AppText style={styles.withdrawalText}>회원 탈퇴</AppText>

            <ChevronRight size={18} color="#D92D20" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </>
  );
}

export default AccountSettingsSection;

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 12,
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
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
    color: colors.textSecondary,
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
