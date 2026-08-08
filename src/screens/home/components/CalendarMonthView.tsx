import { Pressable, StyleSheet, View } from 'react-native';
import type { CalendarProps, DateData } from 'react-native-calendars';
import AppText from '../../../components/common/AppText.tsx';
import AppCalendar from '../../../components/common/AppCalendar.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { TeamCalendarGame } from '../../../features/game/types.ts';

type CalendarDayProps = {
  date?: DateData;
  state?: 'selected' | 'disabled' | 'inactive' | 'today' | '';
};

interface CalendarMonthViewProps {
  selectedDate: string;
  today: string;
  gamesByDate: Record<string, TeamCalendarGame[]>;
  attendedDates: Set<string>;
  playableDates: Set<string>;
  isLoadingTeamGames: boolean;
  onPressDay: (day: DateData) => void;
  onMonthChange: (month: DateData) => void;
}

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

function CalendarMonthView({
  selectedDate,
  today,
  gamesByDate,
  attendedDates,
  playableDates,
  isLoadingTeamGames,
  onPressDay,
  onMonthChange,
}: CalendarMonthViewProps) {
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
        onPress={() => onPressDay(date)}
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
    <View style={styles.calendarCard}>
      <AppCalendar
        key="team-calendar-rounded-grid-v6"
        contained={false}
        current={selectedDate}
        firstDay={0}
        dayComponent={renderCalendarDay}
        onMonthChange={onMonthChange}
        displayLoadingIndicator={isLoadingTeamGames}
        theme={calendarTheme}
      />
    </View>
  );
}

export default CalendarMonthView;

const styles = StyleSheet.create({
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
    backgroundColor: colors.accentYellow,
    transform: [
      {
        translateX: -7,
      },
    ],
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
    backgroundColor: colors.successSoft,
  },

  calendarLossResult: {
    backgroundColor: colors.errorSoft,
  },

  calendarDrawResult: {
    backgroundColor: colors.infoSoft,
  },
});
