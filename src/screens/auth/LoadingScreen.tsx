import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppText from '../../components/common/AppText.tsx';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';

type LoadingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

function LoadingScreen() {
  const navigation = useNavigation<LoadingNavigationProp>();

  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Auth'), 1500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <AppText style={styles.brandText}>STICKET</AppText>
        <AppText style={styles.description}>
          직관의 순간을 티켓처럼 남겨보세요
        </AppText>
      </View>

      <View style={styles.loadingArea}>
        <ActivityIndicator
          size="small"
          color={colors.primary}
          accessibilityLabel="앱을 불러오는 중"
        />
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
    gap: 12,
  },
  brandText: {
    fontSize: 38,
    fontFamily: fonts.black,
    color: colors.primary,
  },
  description: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  loadingArea: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
