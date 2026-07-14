import { Calendar, CalendarProps } from 'react-native-calendars';
import { StyleSheet, View } from 'react-native';
import '../../config/calendarLocale.ts';
import { fonts } from '../../styles/fonts.ts';
import { colors } from '../../styles/colors.ts';

interface AppCalendarProps extends CalendarProps {
  contained?: boolean;
}

function AppCalendar({ contained = true, theme, ...props }: AppCalendarProps) {
  return (
    <View style={contained && styles.calendarCard}>
      <Calendar
        firstDay={1}
        monthFormat={'yyyy년 M월'}
        {...props}
        theme={{
          calendarBackground: colors.surface,
          textSectionTitleColor: '#9A9A9A',
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.onPrimary,
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.disabled,
          monthTextColor: colors.text,
          arrowColor: colors.primary,
          textDayFontFamily: fonts.regular,
          textMonthFontFamily: fonts.regular,
          textDayHeaderFontFamily: fonts.regular,
          textDayFontSize: 15,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 12,
          textDayFontWeight: '400',
          textMonthFontWeight: '400',
          textDayHeaderFontWeight: '400',
          ...theme,
        }}
      />
    </View>
  );
}

export default AppCalendar;

const styles = StyleSheet.create({
  calendarCard: {
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
});
