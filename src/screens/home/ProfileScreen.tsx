import { StyleSheet, View } from 'react-native';
import AppText from '../../components/common/AppText.tsx';
import { fonts } from '../../styles/fonts.ts';
import { colors } from '../../styles/colors.ts';

function ProfileScreen() {
  return (
    <View style={styles.container}>
      <AppText style={styles.title}>프로필</AppText>
    </View>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
  },
});
