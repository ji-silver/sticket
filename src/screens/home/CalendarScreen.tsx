import { StyleSheet, View } from 'react-native';
import { fonts } from '../../styles/fonts.ts';
import AppText from '../../components/common/AppText.tsx';

function CalendarScreen() {
  return (
    <View style={styles.container}>
      <AppText style={styles.title}>캘린더</AppText>
    </View>
  );
}

export default CalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: '#111111',
  },
});
