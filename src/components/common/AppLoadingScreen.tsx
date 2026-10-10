import type { PropsWithChildren } from 'react';
import { Image, StatusBar, StyleSheet, View } from 'react-native';
import { colors } from '../../styles/colors';

export default function AppLoadingScreen({ children }: PropsWithChildren) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.content}>
        <View style={styles.logoFrame}>
          <Image
            source={require('../../assets/brand/logo-transparent.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible
            accessibilityRole="image"
            accessibilityLabel="STICKET 로고"
          />
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoFrame: { width: 120, height: 120, overflow: 'hidden' },
  logo: { width: '100%', height: '100%' },
});
