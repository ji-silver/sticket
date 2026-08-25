import {
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton.tsx';
import AppText from '../../components/common/AppText.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import { useAuth } from '../../features/auth/AuthProvider.tsx';

function LoadingScreen() {
  const { status, errorMessage, retry } = useAuth();
  const hasError = status === 'error';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        <View style={styles.logoFrame}>
          <Image
            source={require('../../assets/auth/ticket_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible
            accessibilityRole="image"
            accessibilityLabel="STICKET 로고"
          />
        </View>

        {hasError ? (
          <View style={styles.errorArea}>
            <AppText style={styles.errorText}>
              {errorMessage || '로그인 정보를 확인하지 못했어요.'}
            </AppText>
            <AppButton
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
              onPress={retry}
              accessibilityRole="button"
              accessibilityLabel="로그인 정보 다시 불러오기"
            >
              <AppText style={styles.retryButtonText}>다시 시도</AppText>
            </AppButton>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoFrame: {
    width: 120,
    height: 120,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },

  errorArea: {
    marginTop: 28,
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    paddingHorizontal: 24,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 40,
    paddingHorizontal: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  retryButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
