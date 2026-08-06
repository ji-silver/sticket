import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AppText from '../../components/common/AppText.tsx';
import ResponsiveContent from '../../components/common/ResponsiveContent.tsx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import AppCalendar from '../../components/common/AppCalendar.tsx';
import { useState } from 'react';
import type { CalendarProps, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { getTodayInKorea } from '../../lib/date.ts';
import { useGetTickets } from '../../features/ticket/api/useGetTickets';
import { useGetLeagueGameDatesByMonth } from '../../features/game/api/useGetLeagueGameDatesByMonth';
import { useGetTeamGamesByMonth } from '../../features/game/api/useGetTeamGamesByMonth';
import TicketCard from '../ticket/components/TicketCard.tsx';
import EmptyCard from '../../components/common/EmptyCard.tsx';
import { Plus } from 'lucide-react-native';
import { useAuth } from '../../features/auth/AuthProvider.tsx';
import { getTicketBooks } from '../../features/ticket-book/ticketBook.service.ts';
import { TeamCalendarGame } from '../../features/game/types.ts';

type CalendarNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CalendarDayProps = {
  date?: DateData;
  state?: 'selected' | 'disabled' | 'inactive' | 'today' | '';
};

const formatSelectedDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

  return `${month}월 ${day}일 ${weekday}요일`;
};

const getGameSummary = (games: TeamCalendarGame[]) => {
  if (games.length > 1) {
    return `${games.length} 경기`;
  }

  const game = games[0];

  if (!game) {
    return null;
  }

  if (game.status === 'CANCELLED') {
    return '취소';
  }

  if (
    game.status !== 'FINISHED' ||
    game.awayScore === null ||
    game.homeScore === null
  ) {
    return game.opponentName;
  }

  const favoriteTeamScore =
    game.homeAway === 'H' ? game.homeScore : game.awayScore;
  const opponentTeamScore =
    game.homeAway === 'A' ? game.homeScore : game.awayScore;

  const result =
    favoriteTeamScore > opponentTeamScore
      ? '승'
      : favoriteTeamScore < opponentTeamScore
      ? '패'
      : '무';

  return `${game.awayScore}:${game.homeScore} ${result}`;
};

const calendarTheme = {
  calendarBackground: colors.surface,
  weekVerticalMargin: 0,
  'stylesheet.calendar.header': {
    week: {
      marginTop: 7,
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    dayHeader: {
      flex: 1,
      height: 32,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      color: '#9A9A9A',
      fontSize: 12,
      fontFamily: fonts.regular,
      fontWeight: '400',
      lineHeight: 32,
      textAlign: 'center',
    },
  },
  'stylesheet.calendar.main': {
    container: {
      paddingLeft: 0,
      paddingRight: 0,
      backgroundColor: colors.surface,
    },
    monthView: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      borderCurve: 'continuous',
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    week: {
      marginVertical: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
  },
} as CalendarProps['theme'];

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

  const isLoading = isLoadingTickets;

  const handlePressAddTicket = async () => {
    try {
      const ticketBooks = await getTicketBooks();

      if (ticketBooks.length > 0) {
        navigation.navigate('AddTicket', { initialDate: selectedDate });
        return;
      }

      Alert.alert(
        '다이어리가 없어요',
        '직관 기록을 추가하려면 먼저 다이어리를 만들어 주세요.',
        [
          { text: '취소', style: 'cancel' },
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

  const renderCalendarDay = ({ date, state }: CalendarDayProps) => {
    if (!date) {
      return <View style={styles.calendarDay} />;
    }

    const dateGames = gamesByDate[date.dateString] ?? [];
    const firstGame = dateGames[0];
    const gameSummary = getGameSummary(dateGames);
    const gameResult = gameSummary?.endsWith('승')
      ? '승'
      : gameSummary?.endsWith('패')
      ? '패'
      : gameSummary?.endsWith('무')
      ? '무'
      : null;
    const gameResultStyle =
      gameResult === '승'
        ? styles.calendarWinResult
        : gameResult === '패'
        ? styles.calendarLossResult
        : gameResult === '무'
        ? styles.calendarDrawResult
        : null;
    const gameSummaryText = gameResult
      ? gameSummary?.slice(0, -2)
      : gameSummary;

    const isToday = date.dateString === today;
    const isInactive =
      state === 'disabled' ||
      state === 'inactive' ||
      !playableDates.has(date.dateString);
    const isSelected = !isInactive && date.dateString === selectedDate;
    const isLastColumn = new Date(date.timestamp).getDay() === 6;
    const hasAttendance = !isInactive && attendedDates.has(date.dateString);

    const accessibilityGameText = firstGame
      ? `, ${firstGame.homeAway === 'H' ? '홈' : '원정'} 경기, 상대 ${
          firstGame.opponentName
        }, ${gameSummary}`
      : '';
    const accessibilityAttendanceText = hasAttendance ? ', 직관 기록 있음' : '';

    return (
      <Pressable
        style={({ pressed }) => [
          styles.calendarDay,
          isLastColumn && styles.calendarDayLastColumn,
          isSelected && styles.calendarDaySelected,
          pressed && styles.calendarDayPressed,
        ]}
        onPress={() => handlePressDay(date)}
        disabled={isInactive}
        accessibilityRole="button"
        accessibilityLabel={`${date.month}월 ${date.day}일${accessibilityGameText}${accessibilityAttendanceText}`}
        accessibilityState={{
          selected: isSelected,
          disabled: isInactive,
        }}
      >
        <View style={styles.calendarDayTopRow}>
          <View style={styles.calendarDate}>
            {hasAttendance ? (
              <View style={styles.calendarAttendanceDate} />
            ) : null}

            <AppText
              style={[
                styles.calendarDayNumber,
                isToday && styles.calendarTodayText,
                isInactive && styles.calendarInactiveText,
              ]}
            >
              {date.day}
            </AppText>
          </View>

          {firstGame ? (
            <AppText
              style={[
                styles.calendarHomeAway,
                firstGame.homeAway === 'H'
                  ? styles.calendarHome
                  : styles.calendarAway,
              ]}
            >
              {firstGame.homeAway}
            </AppText>
          ) : null}
        </View>

        {gameSummary && gameResult ? (
          <View
            style={[
              styles.calendarResultRow,
              isInactive && styles.calendarInactiveResult,
            ]}
          >
            <AppText style={styles.calendarResultScore} numberOfLines={1}>
              {gameSummaryText}
            </AppText>
            <AppText
              style={[styles.calendarResultBadge, gameResultStyle]}
              numberOfLines={1}
            >
              {gameResult}
            </AppText>
          </View>
        ) : gameSummary ? (
          <AppText
            style={[
              styles.calendarGameSummary,
              isInactive && styles.calendarInactiveText,
            ]}
            numberOfLines={1}
          >
            {gameSummary}
          </AppText>
        ) : null}
      </Pressable>
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
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <View style={styles.header}>
            <AppText style={styles.headerTitle}>캘린더</AppText>
          </View>

          <View style={styles.calendarCard}>
            <AppCalendar
              key="team-calendar-rounded-grid-v6"
              contained={false}
              current={selectedDate}
              firstDay={0}
              dayComponent={renderCalendarDay}
              onMonthChange={handleMonthChange}
              displayLoadingIndicator={isLoadingTeamGames}
              theme={calendarTheme}
            />
          </View>

          <View style={styles.recordSection}>
            <View style={styles.recordHeader}>
              <AppText style={styles.selectedDateText}>
                {formatSelectedDate(selectedDate)}
              </AppText>
            </View>

            {isLoading || isLoadingTeamGames ? (
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
            ) : selectedGames.length > 0 ? (
              <View style={styles.teamGameList}>
                {selectedGames.map(game => {
                  const awayTeamName =
                    game.homeAway === 'A'
                      ? favoriteTeamName
                      : game.opponentName;
                  const homeTeamName =
                    game.homeAway === 'H'
                      ? favoriteTeamName
                      : game.opponentName;
                  const isFinished =
                    game.status === 'FINISHED' &&
                    game.awayScore !== null &&
                    game.homeScore !== null;
                  const statusText =
                    game.status === 'CANCELLED'
                      ? '경기 취소'
                      : game.status === 'IN_PROGRESS'
                      ? '경기 중'
                      : isFinished
                      ? '경기 종료'
                      : '경기 예정';
                  const centerText =
                    game.status === 'CANCELLED'
                      ? '취소'
                      : isFinished
                      ? `${game.awayScore} : ${game.homeScore}`
                      : 'VS';

                  return (
                    <View key={game.id} style={styles.teamGameCard}>
                      <AppText style={styles.teamGameStatus}>
                        {statusText}
                      </AppText>

                      <View style={styles.teamGameMatchup}>
                        <AppText style={styles.teamGameTeam} numberOfLines={1}>
                          {awayTeamName}
                        </AppText>
                        <AppText style={styles.teamGameScore}>
                          {centerText}
                        </AppText>
                        <AppText style={styles.teamGameTeam} numberOfLines={1}>
                          {homeTeamName}
                        </AppText>
                      </View>

                      <AppText style={styles.teamGameMeta}>
                        {game.time} · {game.stadiumName}
                      </AppText>

                      {selectedDate <= today && game.status !== 'CANCELLED' ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.addTicketButton,
                            styles.teamGameAddButton,
                            pressed && styles.addTicketButtonPressed,
                          ]}
                          onPress={handlePressAddTicket}
                          accessibilityRole="button"
                          accessibilityLabel="선택한 경기에 직관 기록 추가"
                        >
                          <Plus
                            size={15}
                            color={colors.onPrimary}
                            strokeWidth={2.6}
                          />
                          <AppText style={styles.addTicketButtonText}>
                            티켓 추가
                          </AppText>
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <EmptyCard
                title={
                  selectedDate <= today
                    ? '우리 팀 경기가 없는 날이에요'
                    : '예정된 우리 팀 경기가 없어요'
                }
                description={
                  selectedDate <= today
                    ? '다른 경기를 직관했다면 기록을 남겨보세요'
                    : '다른 날짜를 선택해 보세요'
                }
                style={styles.emptyCard}
              >
                {selectedDate <= today ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.addTicketButton,
                      pressed && styles.addTicketButtonPressed,
                    ]}
                    onPress={handlePressAddTicket}
                    accessibilityRole="button"
                    accessibilityLabel="선택한 날짜에 티켓 추가"
                  >
                    <Plus
                      size={15}
                      color={colors.onPrimary}
                      strokeWidth={2.6}
                    />
                    <AppText style={styles.addTicketButtonText}>
                      티켓 추가
                    </AppText>
                  </Pressable>
                ) : null}
              </EmptyCard>
            )}
          </View>
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
  calendarCard: {
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },

  calendarDay: {
    alignSelf: 'stretch',
    height: 56,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  calendarDayLastColumn: {
    borderRightWidth: 0,
  },
  calendarDaySelected: {
    backgroundColor: colors.primarySoft,
  },
  calendarDayPressed: {
    backgroundColor: colors.primarySoft,
  },
  calendarDayTopRow: {
    height: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarDate: {
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarAttendanceDate: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderCurve: 'continuous',
    backgroundColor: '#BFD3E2',
    transform: [{ translateX: -7 }],
  },
  calendarDayNumber: {
    fontSize: 10,
    fontFamily: fonts.regular,
    lineHeight: 14,
    color: colors.text,
    zIndex: 1,
  },
  calendarTodayText: {
    color: colors.primary,
  },
  calendarInactiveText: {
    color: colors.disabled,
  },
  calendarHomeAway: {
    fontSize: 10,
    fontFamily: fonts.regular,
    lineHeight: 14,
  },
  calendarHome: {
    color: colors.primary,
  },
  calendarAway: {
    color: colors.textSecondary,
  },
  calendarGameSummary: {
    alignSelf: 'stretch',
    marginTop: 6,
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  calendarResultRow: {
    alignSelf: 'stretch',
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  calendarInactiveResult: {
    opacity: 0.4,
  },
  calendarResultScore: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  calendarResultBadge: {
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 4,
    borderCurve: 'continuous',
    overflow: 'hidden',
    fontSize: 8,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    lineHeight: 14,
    textAlign: 'center',
  },
  calendarWinResult: {
    backgroundColor: '#E7F3EC',
  },
  calendarLossResult: {
    backgroundColor: '#FDECEC',
  },
  calendarDrawResult: {
    backgroundColor: '#F0F1F2',
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
  teamGameList: {
    gap: 12,
  },
  teamGameCard: {
    padding: 24,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
  },
  teamGameStatus: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  teamGameMatchup: {
    alignSelf: 'stretch',
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamGameTeam: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
  teamGameScore: {
    minWidth: 72,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  teamGameMeta: {
    marginTop: 14,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  teamGameAddButton: {
    marginTop: 20,
  },
  emptyCard: {
    minHeight: 166,
  },
  addTicketButton: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 19,
    borderCurve: 'continuous',
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
