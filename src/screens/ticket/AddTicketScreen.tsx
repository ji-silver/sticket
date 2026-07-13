import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import AppText from '../../components/common/AppText.tsx';
import { fonts } from '../../styles/fonts.ts';
import { useNavigation } from '@react-navigation/core';
import { useMemo, useState } from 'react';
import AppCalendar from '../../components/common/AppCalendar.tsx';
import { DateData } from 'react-native-calendars';

function AddTicketScreen() {
  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);

  const selectedDateText = useMemo(() => {
    if (!selectedDate) return '';

    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

    return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
  }, [selectedDate]);

  const markedDates = useMemo(() => {
    if (!selectedDate) return {};

    return {
      [selectedDate]: {
        selected: true,
        selectedColor: '#111111',
        selectedTextColor: '#FFFFFF',
      },
    };
  }, [selectedDate]);

  const handlePressDay = (day: DateData) => {
    setSelectedDate(day.dateString);
    setIsCalendarOpen(false);
  };

  const handlePressDateSummary = () => {
    setIsCalendarOpen(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole={'button'}
          accessibilityLabel={'뒤로 가기'}
        >
          <ChevronLeft size={26} color={'#111111'} strokeWidth={2.4} />
        </Pressable>

        <AppText style={styles.headerTitle}>티켓 추가</AppText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>직관 날짜</AppText>
        </View>

        {selectedDate && (
          <Pressable
            style={styles.dateSummaryCard}
            onPress={handlePressDateSummary}
            accessibilityRole={'button'}
            accessibilityLabel={'직관 날짜 다시 선택'}
          >
            <View>
              <AppText style={styles.dateSummaryLabel}>선택한 날짜</AppText>
              <AppText style={styles.dateSummaryText}>
                {selectedDateText}
              </AppText>
            </View>
            <AppText style={styles.changeButtonText}>변경</AppText>
          </Pressable>
        )}

        {isCalendarOpen && (
          <AppCalendar
            current={selectedDate || undefined}
            markedDates={markedDates}
            onDayPress={handlePressDay}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default AddTicketScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    height: 52,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 34,
    height: 34,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 2,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#111111',
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#111111',
  },

  dateSummaryCard: {
    minHeight: 82,
    marginBottom: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#F7F7F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSummaryLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#9A9A9A',
  },
  dateSummaryText: {
    marginTop: 6,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#111111',
  },
  changeButtonText: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#111111',
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
});
