import { StyleSheet, View } from 'react-native';
import AppLoadingScreen from '../../components/common/AppLoadingScreen';
import AppButton from '../../components/common/AppButton.tsx';
import AppText from '../../components/common/AppText.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import { useAuth } from '../../features/auth/AuthProvider.tsx';

function LoadingScreen() {
  const { status, errorMessage, retry } = useAuth();
  const hasError = status === 'error';

  return (
    <AppLoadingScreen>
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
    </AppLoadingScreen>
  );
}

export default LoadingScreen;

const styles = StyleSheet.create({
  errorArea: {
    marginTop: 28,
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    paddingHorizontal: 24,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 40,
    paddingHorizontal: 18,
    backgroundColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonPressed: {
    backgroundColor: colors.primary50,
  },
  retryButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});
