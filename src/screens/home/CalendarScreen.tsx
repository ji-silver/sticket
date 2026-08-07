import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DateData } from 'react-native-calendars';
import AppText from '../../components/common/AppText.tsx';
import ResponsiveContent from '../../components/common/ResponsiveContent.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { getTodayInKorea } from '../../lib/date.ts';
import { useGetTickets } from '../../features/ticket/api/useGetTickets';
import { useGetLeagueGameDatesByMonth } from '../../features/game/api/useGetLeagueGameDatesByMonth';
import { useGetTeamGamesByMonth } from '../../features/game/api/useGetTeamGamesByMonth';
import { useAuth } from '../../features/auth/AuthProvider.tsx';
import { getTicketBooks } from '../../features/ticket-book/ticketBook.service.ts';
import type { TeamCalendarGame } from '../../features/game/types.ts';
import CalendarMonthView from './components/CalendarMonthView.tsx';
import CalendarTicketList from './components/CalendarTicketList.tsx';

type CalendarNavigationProp = NativeStackNavigationProp<RootStackParamList>;

function CalendarScreen() {
  const horizontalPadding = 20;

  const navigation = useNavigation<CalendarNavigationProp>();
  const { profile } = useAuth();

  const today = getTodayInKorea();

  const [visibleMonth, setVisibleMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: tickets = [], isLoading: isLoadingTickets } = useGetTickets();

  const { data: teamGames = [], isLoading: isLoadingTeamGames } =
    useGetTeamGamesByMonth(profile?.favorite_team_id, visibleMonth);

  const { data: leagueGameDates = [] } =
    useGetLeagueGameDatesByMonth(visibleMonth);

  const handlePressAddTicket = async () => {
    try {
      const ticketBooks = await getTicketBooks();

      if (ticketBooks.length > 0) {
        navigation.navigate('AddTicket', {
          initialDate: selectedDate,
        });

        return;
      }

      Alert.alert(
        '다이어리가 없어요',
        '직관 기록을 추가하려면 먼저 다이어리를 만들어 주세요.',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '다이어리 추가',
            onPress: () => navigation.navigate('AddDiary'),
          },
        ],
      );
    } catch (error) {
      console.error('다이어리 목록을 확인하지 못했습니다.', error);

      Alert.alert(
        '다이어리 정보를 확인하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const gamesByDate = teamGames.reduce<Record<string, TeamCalendarGame[]>>(
    (result, game) => {
      if (!result[game.date]) {
        result[game.date] = [];
      }

      result[game.date].push(game);

      return result;
    },
    {},
  );

  const attendedDates = new Set(tickets.map(ticket => ticket.matchDate));

  const playableDates = new Set([...leagueGameDates, ...attendedDates]);

  const selectedRecords = tickets.filter(
    ticket => ticket.matchDate === selectedDate,
  );

  const selectedGames = gamesByDate[selectedDate] ?? [];

  const favoriteTeamName = profile?.favorite_team?.short_name ?? '응원 구단';

  const handlePressDay = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    const nextMonth = `${month.year}-${String(month.month).padStart(2, '0')}`;

    setVisibleMonth(nextMonth);

    setSelectedDate(
      nextMonth === today.slice(0, 7) ? today : `${nextMonth}-01`,
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContent
          style={[
            styles.horizontalContent,
            {
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <View style={styles.header}>
            <AppText style={styles.headerTitle}>캘린더</AppText>
          </View>

          <CalendarMonthView
            selectedDate={selectedDate}
            today={today}
            gamesByDate={gamesByDate}
            attendedDates={attendedDates}
            playableDates={playableDates}
            isLoadingTeamGames={isLoadingTeamGames}
            onPressDay={handlePressDay}
            onMonthChange={handleMonthChange}
          />

          <CalendarTicketList
            selectedDate={selectedDate}
            today={today}
            selectedRecords={selectedRecords}
            selectedGames={selectedGames}
            favoriteTeamName={favoriteTeamName}
            isLoading={isLoadingTickets || isLoadingTeamGames}
            onPressTicket={ticketId =>
              navigation.navigate('TicketDetail', {
                ticketId,
              })
            }
            onPressAddTicket={handlePressAddTicket}
          />
        </ResponsiveContent>
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
    paddingTop: 18,
    paddingBottom: 32,
  },

  horizontalContent: {
    paddingHorizontal: 12,
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
});
