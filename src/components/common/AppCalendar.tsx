import { Calendar, CalendarProps } from 'react-native-calendars';
import { StyleSheet, View } from 'react-native';
import '../../config/calendarLocale.ts';
import { fonts } from '../../styles/fonts.ts';

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
          calendarBackground: '#FFFFFF',
          textSectionTitleColor: '#9A9A9A',
          selectedDayBackgroundColor: '#111111',
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: '#111111',
          dayTextColor: '#111111',
          textDisabledColor: '#D8D8D8',
          monthTextColor: '#111111',
          arrowColor: '#111111',
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
});
