import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppText from '../../components/common/AppText.tsx';
import ResponsiveContent from '../../components/common/ResponsiveContent.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { useAuth } from '../../features/auth/AuthProvider.tsx';
import ProfileSummarySection from './components/ProfileSummarySection.tsx';
import BaseballProfileSection from './components/BaseballProfileSection.tsx';

function ProfileScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useAuth();

  if (!profile) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppText style={styles.headerTitle} accessibilityRole="header">
          프로필
        </AppText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: tabBarHeight + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContent>
          <ProfileSummarySection
            nickname={profile.nickname}
            onPressEdit={() => navigation.navigate('ProfileEdit')}
          />
          {/* 현재 성적 서비스와 시즌권 정보는 야구 전용이다. 다른 종목에 같은 규칙을 적용하지 않는다. */}
          {profile.favorite_team?.sport === 'baseball' ? (
            <BaseballProfileSection profile={profile} />
          ) : null}
        </ResponsiveContent>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  scroll: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
