import { Alert, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import AppButton from '../../components/common/AppButton.tsx';
import AppText from '../../components/common/AppText.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import {
  getLastAuthProvider,
  signInWithApple,
  signInWithGoogle,
  signInWithKakao,
} from '../../features/auth/auth.service.ts';
import type { LastAuthProvider } from '../../features/auth/auth.service.ts';

const AUTH_PROVIDER_LABELS: Record<LastAuthProvider, string> = {
  apple: 'Apple',
  google: 'Google',
  kakao: '카카오',
};

function RecentLoginBubble({ provider }: { provider: LastAuthProvider }) {
  return (
    <View
      accessible
      accessibilityLabel={`${AUTH_PROVIDER_LABELS[provider]} 최근 로그인`}
      pointerEvents="none"
      style={styles.recentLoginBubble}
    >
      <AppText style={styles.recentLoginText}>최근 로그인</AppText>
      <View style={styles.recentLoginTail} />
    </View>
  );
}

function AuthScreen() {
  const [lastAuthProvider, setLastAuthProvider] =
    useState<LastAuthProvider | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<
    'apple' | 'google' | 'kakao' | null
  >(null);

  const isLoading = loadingProvider !== null;

  useEffect(() => {
    let isActive = true;

    getLastAuthProvider().then(provider => {
      if (isActive) {
        setLastAuthProvider(provider);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const handlePressKakao = async () => {
    if (isLoading) return;

    setLoadingProvider('kakao');

    try {
      await signInWithKakao();
    } catch (error) {
      console.error('카카오 로그인에 실패했습니다.', error);

      Alert.alert('카카오 로그인에 실패했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const handlePressApple = async () => {
    if (isLoading) return;

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
    if (isLoading) return;

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
          <AppText style={styles.brandText}>스티켓</AppText>
          <AppText style={styles.title}>
            직관의 순간을 티켓처럼 남겨보세요
          </AppText>
        </View>
      </View>

      <View style={styles.loginArea}>
        <View
          style={[
            styles.loginButtonWrapper,
            lastAuthProvider === 'kakao' && styles.recentLoginButtonWrapper,
          ]}
        >
          {lastAuthProvider === 'kakao' ? (
            <RecentLoginBubble provider="kakao" />
          ) : null}
          <AppButton
            style={({ pressed }) => [
              styles.loginButton,
              styles.kakaoButton,
              pressed && !isLoading && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handlePressKakao}
            disabled={isLoading}
            isLoading={loadingProvider === 'kakao'}
            loadingColor="rgba(0, 0, 0, 0.85)"
            accessibilityRole="button"
            accessibilityLabel="카카오로 계속하기"
            accessibilityState={{ disabled: isLoading }}
          >
            <Image
              source={require('../../assets/auth/kakao-symbol.png')}
              style={styles.kakaoLogo}
              resizeMode="contain"
            />
            <AppText style={styles.kakaoButtonText}>카카오로 계속하기</AppText>
          </AppButton>
        </View>

        <View
          style={[
            styles.loginButtonWrapper,
            lastAuthProvider === 'apple' && styles.recentLoginButtonWrapper,
          ]}
        >
          {lastAuthProvider === 'apple' ? (
            <RecentLoginBubble provider="apple" />
          ) : null}
          <AppButton
            style={({ pressed }) => [
              styles.loginButton,
              styles.appleButton,
              pressed && !isLoading && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handlePressApple}
            disabled={isLoading}
            isLoading={loadingProvider === 'apple'}
            accessibilityRole="button"
            accessibilityLabel="Apple로 계속하기"
            accessibilityState={{ disabled: isLoading }}
          >
            <Image
              testID="apple-login-logo"
              source={require('../../assets/auth/apple-logo.png')}
              style={styles.appleLogo}
              resizeMode="contain"
            />
            <AppText style={styles.appleButtonText}>Apple로 계속하기</AppText>
          </AppButton>
        </View>

        <View
          style={[
            styles.loginButtonWrapper,
            lastAuthProvider === 'google' && styles.recentLoginButtonWrapper,
          ]}
        >
          {lastAuthProvider === 'google' ? (
            <RecentLoginBubble provider="google" />
          ) : null}
          <AppButton
            style={({ pressed }) => [
              styles.loginButton,
              styles.googleButton,
              pressed && !isLoading && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handlePressGoogle}
            disabled={isLoading}
            isLoading={loadingProvider === 'google'}
            loadingColor={colors.text}
            accessibilityRole="button"
            accessibilityLabel="Google로 계속하기"
            accessibilityState={{ disabled: isLoading }}
          >
            <Image
              source={require('../../assets/auth/google-g.png')}
              style={styles.googleLogo}
              resizeMode="contain"
            />

            <AppText style={styles.googleButtonText}>Google로 계속하기</AppText>
          </AppButton>
        </View>
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
    fontFamily: fonts.logo,
    color: colors.primary,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  loginArea: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 76,
    gap: 10,
  },
  loginButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  loginButtonWrapper: {
    position: 'relative',
  },
  recentLoginButtonWrapper: {
    marginTop: 20,
  },
  recentLoginBubble: {
    position: 'absolute',
    top: -22,
    right: 14,
    zIndex: 1,
    minHeight: 20,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  recentLoginText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.onPrimary,
  },
  recentLoginTail: {
    position: 'absolute',
    right: 14,
    bottom: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  kakaoButton: {
    borderRadius: 12,
    backgroundColor: '#FEE500',
    overflow: 'hidden',
  },
  kakaoLogo: {
    width: 24,
    height: 24,
  },
  kakaoButtonText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: 'rgba(0, 0, 0, 0.85)',
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
    width: 50,
    height: 50,
    marginLeft: -14,
    marginRight: -14,
    marginTop: 0,
  },
  appleButtonText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.onPrimary,
  },
  googleLogo: {
    width: 22,
    height: 22,
  },
  googleButtonText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: '#1F1F1F',
  },
});
