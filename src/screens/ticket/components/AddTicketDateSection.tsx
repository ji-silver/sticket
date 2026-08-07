import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import AppCalendar from '../../../components/common/AppCalendar.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { DateData } from 'react-native-calendars';

interface AddTicketDateSectionProps {
  today: string;
  selectedDate: string;
  isCalendarOpen: boolean;
  onPressDay: (day: DateData) => void;
  onPressDateSummary: () => void;
}

export default function AddTicketDateSection({
  today,
  selectedDate,
  isCalendarOpen,
  onPressDay,
  onPressDateSummary,
}: AddTicketDateSectionProps) {
  const selectedDateText = selectedDate ? formatDateText(selectedDate) : '';

  const markedDates = selectedDate
    ? {
        [selectedDate]: {
          selected: true,
          selectedColor: colors.primary,
          selectedTextColor: colors.onPrimary,
        },
      }
    : {};

  return (
    <>
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>직관 날짜</AppText>
      </View>

      {selectedDate ? (
        <View style={styles.dateSummaryCard}>
          <View style={styles.dateSummaryTextArea}>
            <AppText style={styles.dateSummaryLabel}>선택한 날짜</AppText>
            <AppText style={styles.dateSummaryText}>{selectedDateText}</AppText>
          </View>

          <InlineActionButton
            label="변경"
            tone="primary"
            onPress={onPressDateSummary}
            accessibilityLabel="직관 날짜 다시 선택"
          />
        </View>
      ) : null}

      {isCalendarOpen && (
        <AppCalendar
          current={selectedDate || undefined}
          maxDate={today}
          disableAllTouchEventsForDisabledDays
          markedDates={markedDates}
          onDayPress={onPressDay}
        />
      )}
    </>
  );
}

const formatDateText = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

  return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
};

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  dateSummaryCard: {
    minHeight: 82,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSummaryTextArea: {
    flex: 1,
  },
  dateSummaryLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.secondary,
  },
  dateSummaryText: {
    marginTop: 6,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
});
