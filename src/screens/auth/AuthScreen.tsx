import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppText from '../../components/common/AppText.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';

type AuthNavigationProp = NativeStackNavigationProp<RootStackParamList>;

function AuthScreen() {
  const navigation = useNavigation<AuthNavigationProp>();

  const handlePressApple = () => {
    // TODO: Apple 로그인 연동
  };

  const handlePressGoogle = () => {
    // TODO: Google 로그인 연동
  };

  const handlePressPreview = () => {
    navigation.replace('MainTab');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <AppText style={styles.brandText}>STICKET</AppText>
          <AppText style={styles.title}>
            직관의 순간을 티켓처럼 남겨보세요
          </AppText>
        </View>
      </View>

      <View style={styles.loginArea}>
        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            styles.appleButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handlePressApple}
          accessibilityRole="button"
          accessibilityLabel="Apple로 계속하기"
        >
          <Image
            source={require('../../assets/auth/apple-logo.png')}
            style={styles.appleLogo}
          />
          <AppText style={styles.appleButtonText}>Apple로 계속하기</AppText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            styles.googleButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handlePressGoogle}
          accessibilityRole="button"
          accessibilityLabel="Google로 계속하기"
        >
          <Image
            source={require('../../assets/auth/google-g.png')}
            style={styles.googleLogo}
          />
          <AppText style={styles.googleButtonText}>Google로 계속하기</AppText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.previewButton,
            pressed && styles.previewButtonPressed,
          ]}
          onPress={handlePressPreview}
          accessibilityRole="button"
          accessibilityLabel="앱 둘러보기"
        >
          <AppText style={styles.previewButtonText}>지금은 둘러보기</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  brandText: {
    fontSize: 34,
    fontFamily: fonts.black,
    color: colors.primary,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  loginArea: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 10,
    gap: 10,
  },
  loginButton: {
    height: 54,
    borderRadius: 18,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#747775',
    backgroundColor: colors.surface,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  appleLogo: {
    width: 54,
    height: 54,
    marginLeft: -15,
    marginRight: -19,
  },
  appleButtonText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.onPrimary,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: '#1F1F1F',
  },
  previewButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonPressed: {
    opacity: 0.55,
  },
  previewButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
});
