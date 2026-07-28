import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import AppText from '../../components/common/AppText.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import {
  signInWithApple,
  signInWithGoogle,
} from '../../features/auth/auth.service.ts';

function AuthScreen() {
  const [loadingProvider, setLoadingProvider] = useState<
    'apple' | 'google' | null
  >(null);
  const isLoading = loadingProvider !== null;

  const handlePressApple = async () => {
    if (isLoading) {
      return;
    }

    setLoadingProvider('apple');

    try {
      await signInWithApple();
    } catch (error) {
      console.error('Apple 로그인에 실패했습니다.', error);

      Alert.alert('Apple 로그인에 실패했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const handlePressGoogle = async () => {
    if (isLoading) {
      return;
    }

    setLoadingProvider('google');

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google 로그인에 실패했습니다.', error);

      Alert.alert('Google 로그인에 실패했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoadingProvider(null);
    }
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
            pressed && !isLoading && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handlePressApple}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Apple로 계속하기"
          accessibilityState={{ disabled: isLoading }}
        >
          <Image
            source={require('../../assets/auth/apple-logo.png')}
            style={styles.appleLogo}
          />
          <AppText style={styles.appleButtonText}>
            {loadingProvider === 'apple'
              ? '로그인 중...'
              : 'Apple로 계속하기'}
          </AppText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            styles.googleButton,
            pressed && !isLoading && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handlePressGoogle}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Google로 계속하기"
          accessibilityState={{ disabled: isLoading }}
        >
          <Image
            source={require('../../assets/auth/google-g.png')}
            style={styles.googleLogo}
          />

          <AppText style={styles.googleButtonText}>
            {loadingProvider === 'google'
              ? '로그인 중...'
              : 'Google로 계속하기'}
          </AppText>
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
  buttonDisabled: {
    opacity: 0.55,
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
});
