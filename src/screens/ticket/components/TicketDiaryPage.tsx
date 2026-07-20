import { StyleSheet, View } from 'react-native';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

function TicketDiaryPage() {
  return <View style={styles.container}></View>;
}

export default TicketDiaryPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
});
