import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import AppText from '../../../components/common/AppText.tsx';
import EmptyCard from '../../../components/common/EmptyCard.tsx';
import TicketCard from '../../ticket/components/TicketCard.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { Ticket } from '../../../features/ticket/types.ts';
import type { TeamCalendarGame } from '../../../features/game/types.ts';

interface CalendarTicketListProps {
  selectedDate: string;
  today: string;
  selectedRecords: Ticket[];
  selectedGames: TeamCalendarGame[];
  favoriteTeamName: string;
  isLoading: boolean;
  onPressTicket: (ticketId: string) => void;
  onPressAddTicket: () => void;
}

const formatSelectedDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);

  const date = new Date(year, month - 1, day);

  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

  return `${month}월 ${day}일 ${weekday}요일`;
};

function CalendarTicketList({
  selectedDate,
  today,
  selectedRecords,
  selectedGames,
  favoriteTeamName,
  isLoading,
  onPressTicket,
  onPressAddTicket,
}: CalendarTicketListProps) {
  return (
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
              onPress={() => onPressTicket(record.id)}
            />
          ))}
        </View>
      ) : selectedGames.length > 0 ? (
        <View style={styles.teamGameList}>
          {selectedGames.map(game => {
            const awayTeamName =
              game.homeAway === 'A' ? favoriteTeamName : game.opponentName;

            const homeTeamName =
              game.homeAway === 'H' ? favoriteTeamName : game.opponentName;

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
                <AppText style={styles.teamGameStatus}>{statusText}</AppText>

                <View style={styles.teamGameMatchup}>
                  <AppText style={styles.teamGameTeam} numberOfLines={1}>
                    {awayTeamName}
                  </AppText>

                  <AppText style={styles.teamGameScore}>{centerText}</AppText>

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
                    onPress={onPressAddTicket}
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
              onPress={onPressAddTicket}
              accessibilityRole="button"
              accessibilityLabel="선택한 날짜에 티켓 추가"
            >
              <Plus size={15} color={colors.onPrimary} strokeWidth={2.6} />

              <AppText style={styles.addTicketButtonText}>티켓 추가</AppText>
            </Pressable>
          ) : null}
        </EmptyCard>
      )}
    </View>
  );
}

export default CalendarTicketList;

const styles = StyleSheet.create({
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
