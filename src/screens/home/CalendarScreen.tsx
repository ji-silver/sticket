import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AppText from '../../components/common/AppText.tsx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import AppCalendar from '../../components/common/AppCalendar.tsx';
import { useState } from 'react';
import { DateData } from 'react-native-calendars';
import { Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import CalendarTicketCard, {
  CalendarTicketRecord,
} from './components/CalendarTicketCard.tsx';
import EmptyCard from '../../components/common/EmptyCard.tsx';

type CalendarNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const mockAttendanceRecords: CalendarTicketRecord[] = [
  {
    id: 1,
    date: '2026-07-03',
    homeTeamName: '키움',
    awayTeamName: '두산',
    homeScore: 5,
    awayScore: 3,
    stadiumName: '고척스카이돔',
    seatName: '1루 102구역 8열 12번',
    time: '18:30',
    result: 'win',
  },
  {
    id: 2,
    date: '2026-07-14',
    homeTeamName: 'LG',
    awayTeamName: '롯데',
    homeScore: 2,
    awayScore: 3,
    stadiumName: '잠실야구장',
    seatName: '1루 블루석 107구역',
    time: '18:30',
    result: 'lose',
  },
  {
    id: 3,
    date: '2026-07-21',
    homeTeamName: '한화',
    awayTeamName: 'KIA',
    homeScore: 7,
    awayScore: 4,
    stadiumName: '대전한화생명볼파크',
    seatName: '내야 지정석 115구역',
    time: '18:30',
    result: 'win',
  },
  {
    id: 4,
    date: '2026-07-28',
    homeTeamName: 'SSG',
    awayTeamName: 'NC',
    homeScore: 6,
    awayScore: 2,
    stadiumName: 'SSG 랜더스필드',
    seatName: '1루 응원지정석 23블록',
    time: '17:00',
    result: 'win',
  },
  {
    id: 5,
    date: '2026-06-08',
    homeTeamName: 'KT',
    awayTeamName: '삼성',
    homeScore: 4,
    awayScore: 4,
    stadiumName: 'KT 위즈파크',
    seatName: '중앙 지정석 206구역',
    time: '18:30',
    result: 'draw',
  },
];

const formatDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatSelectedDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

  return `${month}월 ${day}일 ${weekday}요일`;
};

function CalendarScreen() {
  const navigation = useNavigation<CalendarNavigationProp>();
  const todayString = formatDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayString);

  const markedDates: Record<string, object> = {};

  mockAttendanceRecords.forEach(record => {
    markedDates[record.date] = {
      marked: true,
      dotColor: colors.primary,
    };
  });

  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: colors.primary,
    selectedTextColor: colors.onPrimary,
    dotColor: colors.onPrimary,
  };

  const selectedRecords = mockAttendanceRecords.filter(
    record => record.date === selectedDate,
  );

  const handlePressDay = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>캘린더</AppText>
        </View>

        <AppCalendar
          current={selectedDate}
          markedDates={markedDates}
          onDayPress={handlePressDay}
        />

        <View style={styles.recordSection}>
          <View style={styles.recordHeader}>
            <AppText style={styles.selectedDateText}>
              {formatSelectedDate(selectedDate)}
            </AppText>
          </View>

          {selectedRecords.length > 0 ? (
            <View style={styles.recordList}>
              {selectedRecords.map(record => (
                <CalendarTicketCard
                  key={String(record.id)}
                  record={record}
                  onPress={() => navigation.navigate('TicketList')}
                />
              ))}
            </View>
          ) : (
            <EmptyCard
              title="이날의 직관 기록이 없어요"
              description="새로운 스포츠 추억을 추가해보세요"
              style={styles.emptyCard}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.addTicketButton,
                  pressed && styles.addTicketButtonPressed,
                ]}
                onPress={() => navigation.navigate('AddTicket')}
                accessibilityRole="button"
                accessibilityLabel="티켓 추가"
              >
                <Plus size={15} color={colors.onPrimary} strokeWidth={2.6} />
                <AppText style={styles.addTicketButtonText}>티켓 추가</AppText>
              </Pressable>
            </EmptyCard>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default CalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 32,
  },
  header: {
    minHeight: 42,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  recordSection: {
    marginTop: 26,
  },
  recordHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDateText: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  recordList: {
    gap: 12,
  },
  emptyCard: {
    minHeight: 166,
  },
  addTicketButton: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 19,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  addTicketButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  addTicketButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
