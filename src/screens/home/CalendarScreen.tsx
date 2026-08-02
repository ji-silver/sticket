import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AppText from '../../components/common/AppText.tsx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import AppCalendar from '../../components/common/AppCalendar.tsx';
import { useCallback, useState } from 'react';
import { DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { getTodayInKorea } from '../../lib/date.ts';
import { Ticket } from '../ticket/types.ts';
import { useFocusEffect } from '@react-navigation/native';
import { getTickets } from '../../features/ticket/ticket.service.ts';
import TicketCard from '../ticket/components/TicketCard.tsx';
import EmptyCard from '../../components/common/EmptyCard.tsx';
import { Plus } from 'lucide-react-native';

type CalendarNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatSelectedDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

  return `${month}월 ${day}일 ${weekday}요일`;
};

function CalendarScreen() {
  const navigation = useNavigation<CalendarNavigationProp>();
  const today = getTodayInKorea();

  const [selectedDate, setSelectedDate] = useState(today);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadTickets = async () => {
        setIsLoading(true);

        try {
          const loadedTickets = await getTickets();

          if (isActive) {
            setTickets(loadedTickets);
          }
        } catch (error) {
          console.error('티켓을 불러오지 못했습니다.', error);

          if (isActive) {
            Alert.alert(
              '직관 기록을 불러오지 못했어요',
              '잠시 후 다시 시도해 주세요.',
            );
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      loadTickets();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const markedDates: Record<string, object> = {};

  tickets.forEach(ticket => {
    markedDates[ticket.matchDate] = {
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

  const selectedRecords = tickets.filter(
    ticket => ticket.matchDate === selectedDate,
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

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : selectedRecords.length > 0 ? (
            <View style={styles.recordList}>
              {selectedRecords.map(record => (
                <TicketCard
                  key={record.id}
                  ticket={record}
                  onPress={() =>
                    navigation.navigate('TicketDetail', {
                      ticket: record,
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyCard
              title="이날의 직관 기록이 없어요"
              description="새로운 스포츠 추억을 추가해보세요"
              style={styles.emptyCard}
            >
              {selectedDate <= today ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.addTicketButton,
                    pressed && styles.addTicketButtonPressed,
                  ]}
                  onPress={() =>
                    navigation.navigate('AddTicket', {
                      initialDate: selectedDate,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="선택한 날짜에 티켓 추가"
                >
                  <Plus size={15} color={colors.onPrimary} strokeWidth={2.6} />
                  <AppText style={styles.addTicketButtonText}>
                    티켓 추가
                  </AppText>
                </Pressable>
              ) : null}
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
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
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

  loadingContainer: {
    minHeight: 166,
    alignItems: 'center',
    justifyContent: 'center',
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
