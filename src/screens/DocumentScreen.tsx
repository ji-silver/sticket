import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenHeader from '../components/common/ScreenHeader.tsx';
import { colors } from '../styles/colors.ts';
import type { RootStackParamList } from '../navigation/RootStackNavigator.tsx';

type DocumentScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Document'
>;

function DocumentScreen({ navigation, route }: DocumentScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title={route.params.title}
        onPressBack={() => navigation.goBack()}
      />

      <WebView
        source={{ uri: route.params.uri }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default DocumentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
