import { Pressable, StyleSheet, View } from 'react-native';
import type { CalendarProps, DateData } from 'react-native-calendars';
import AppText from '../../../components/common/AppText.tsx';
import AppCalendar from '../../../components/common/AppCalendar.tsx';
import AppButton from '../../../components/common/AppButton.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { TeamCalendarGame } from '../../../features/game/types.ts';

// 직관 표시는 오늘 테두리와 같은 색상을 낮은 농도로 사용한다.
const attendanceFill = `${colors.primary}26`;

type CalendarDayProps = {
  date?: DateData;
  state?: 'selected' | 'disabled' | 'inactive' | 'today' | '';
};

interface CalendarMonthViewProps {
  visibleMonth: string;
  selectedDate: string;
  today: string;
  gamesByDate: Record<string, TeamCalendarGame[]>;
  attendedDates: Set<string>;
  isLoadingTeamGames: boolean;
  onPressDay: (day: DateData) => void;
  onMonthChange: (month: DateData) => void;
  onPressToday: () => void;
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
  arrowStyle: {
    width: 44,
    height: 44,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
  visibleMonth,
  selectedDate,
  today,
  gamesByDate,
  attendedDates,
  isLoadingTeamGames,
  onPressDay,
  onMonthChange,
  onPressToday,
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

    // 경기 유무로 선택을 막지 않고, 현재 표시한 달 밖의 날짜만 비활성화한다.
    const isInactive = state === 'disabled' || state === 'inactive';

    const isSelected = !isInactive && date.dateString === selectedDate;

    const isLastColumn = new Date(date.timestamp).getDay() === 6;

    const hasAttendance = !isInactive && attendedDates.has(date.dateString);

    const accessibilityGameText = firstGame
      ? `, ${firstGame.homeAway === 'H' ? '홈' : '원정'} 경기, 상대 ${
          firstGame.opponentName
        }, ${gameSummary}`
      : '';

    const accessibilityAttendanceText = hasAttendance ? ', 직관 기록 있음' : '';
    const accessibilityTodayText = isToday ? ', 오늘' : '';

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
        accessibilityLabel={`${date.month}월 ${date.day}일${accessibilityTodayText}${accessibilityGameText}${accessibilityAttendanceText}`}
        accessibilityState={{
          selected: isSelected,
          disabled: isInactive,
        }}
      >
        {/* H/A가 없는 날에도 같은 공간을 남겨 날짜 위치가 움직이지 않게 한다. */}
        <View style={styles.calendarDayTopRow}>
          <View style={styles.calendarDateColumn}>
            <View style={styles.calendarDate}>
              {/* 직관 배경과 오늘 테두리를 분리해 두 상태가 겹쳐도 하나를 숨기지 않는다. */}
              {hasAttendance ? (
                <View
                  pointerEvents="none"
                  style={styles.calendarAttendanceDate}
                />
              ) : null}
              {isToday ? (
                <View pointerEvents="none" style={styles.calendarTodayDate} />
              ) : null}

              <AppText
                style={[
                  styles.calendarDayNumber,
                  isInactive && styles.calendarInactiveText,
                ]}
              >
                {date.day}
              </AppText>
            </View>
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
          ) : (
            <View style={styles.calendarSideColumn} accessible={false} />
          )}
        </View>

        {gameSummary && gameResult ? (
          <View
            style={[
              styles.calendarResultRow,
              isInactive && styles.calendarInactiveResult,
            ]}
          >
            {/* 좁은 날짜 칸의 두 자리 점수는 살짝 축소해 끝자리가 생략되지 않게 한다. */}
            <AppText
              style={styles.calendarResultScore}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={10 / 11}
            >
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
          <View style={styles.calendarResultRow}>
            <AppText
              style={[
                styles.calendarGameSummary,
                isInactive && styles.calendarInactiveText,
              ]}
              numberOfLines={1}
            >
              {gameSummary}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View>
      <View style={styles.calendarCard}>
        {/* current는 최초 표시 월에만 쓰이므로 월이 바뀔 때 달력을 새로 만든다. 같은 달의 날짜 선택은 유지한다. */}
        <AppCalendar
          key={`team-calendar-${visibleMonth}`}
          contained={false}
          current={selectedDate}
          firstDay={0}
          arrowsHitSlop={0}
          dayComponent={renderCalendarDay}
          onMonthChange={onMonthChange}
          displayLoadingIndicator={isLoadingTeamGames}
          theme={calendarTheme}
        />
        {/* 기본 달력 헤더는 접근성에서 자식을 숨긴다. 오늘 버튼은 형제 요소로 두어 VoiceOver에서도 누를 수 있게 한다. */}
        <AppButton
          onPress={onPressToday}
          accessibilityLabel="오늘 날짜로 이동"
          style={({ pressed }) => [
            styles.calendarTodayButton,
            pressed && styles.calendarTodayButtonPressed,
          ]}
        >
          <View style={styles.calendarTodayButtonOutline}>
            <AppText style={styles.calendarTodayButtonText}>오늘</AppText>
          </View>
        </AppButton>
      </View>
      <View style={styles.calendarLegend}>
        <View style={styles.calendarLegendItem}>
          <View style={styles.calendarTodayLegend} accessible={false} />
          <AppText style={styles.calendarLegendText}>오늘</AppText>
        </View>
        <View style={styles.calendarLegendItem}>
          <View style={styles.calendarAttendanceLegend} accessible={false} />
          <AppText style={styles.calendarLegendText}>직관 기록</AppText>
        </View>
      </View>
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

  calendarTodayButton: {
    position: 'absolute',
    top: 6,
    right: 54,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarTodayButtonPressed: {
    opacity: 0.5,
  },

  calendarTodayButtonOutline: {
    width: 44,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarTodayButtonText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.primary,
  },

  calendarDay: {
    alignSelf: 'stretch',
    height: 56,
    paddingHorizontal: 6,
    paddingVertical: 6,
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
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  calendarDateColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },

  calendarSideColumn: {
    width: 12,
  },

  calendarDate: {
    position: 'relative',
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarTodayDate: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 11,
    borderCurve: 'continuous',
  },

  calendarAttendanceDate: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderCurve: 'continuous',
    backgroundColor: attendanceFill,
  },

  calendarDayNumber: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
    color: colors.text,
    zIndex: 1,
  },

  calendarInactiveText: {
    color: colors.disabled,
  },

  calendarHomeAway: {
    width: 12,
    fontSize: 10,
    fontFamily: fonts.regular,
    lineHeight: 14,
    textAlign: 'center',
  },

  calendarHome: {
    color: colors.primary,
  },

  calendarAway: {
    color: colors.textSecondary,
  },

  calendarGameSummary: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  calendarResultRow: {
    alignSelf: 'stretch',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
  },

  calendarInactiveResult: {
    opacity: 0.4,
  },

  calendarResultScore: {
    minWidth: 0,
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  calendarResultBadge: {
    width: 12,
    height: 14,
    paddingHorizontal: 2,
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

  calendarLegend: {
    marginTop: 10,
    paddingHorizontal: 8,
    minHeight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
  },

  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  calendarTodayLegend: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
  },

  calendarAttendanceLegend: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: attendanceFill,
  },

  calendarLegendText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
});
