import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

export type AttendanceResult = 'win' | 'lose' | 'draw';

export interface CalendarTicketRecord {
  id: number;
  date: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  stadiumName: string;
  seatName: string;
  time: string;
  result: AttendanceResult;
}

interface CalendarTicketCardProps {
  record: CalendarTicketRecord;
  onPress: () => void;
}

const resultLabels: Record<AttendanceResult, string> = {
  win: '승리',
  lose: '패배',
  draw: '무승부',
};

function CalendarTicketCard({ record, onPress }: CalendarTicketCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${record.awayTeamName} ${record.awayScore} 대 ${record.homeTeamName} ${record.homeScore}, 티켓 보기`}
    >
      <View style={styles.topRow}>
        <View style={[styles.resultBadge, styles[record.result]]}>
          <AppText style={[styles.resultText, styles[`${record.result}Text`]]}>
            {resultLabels[record.result]}
          </AppText>
        </View>

        <AppText style={styles.timeText}>{record.time}</AppText>
      </View>

      <View style={styles.matchupRow}>
        <View style={styles.teamSide}>
          <AppText style={styles.teamRole}>AWAY</AppText>
          <AppText style={styles.teamName} numberOfLines={1}>
            {record.awayTeamName}
          </AppText>
        </View>

        <View style={styles.scoreRow}>
          <AppText style={styles.scoreText}>{record.awayScore}</AppText>
          <AppText style={styles.scoreDivider}>:</AppText>
          <AppText style={styles.scoreText}>{record.homeScore}</AppText>
        </View>

        <View style={styles.teamSide}>
          <AppText style={styles.teamRole}>HOME</AppText>
          <AppText style={styles.teamName} numberOfLines={1}>
            {record.homeTeamName}
          </AppText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaTextGroup}>
          <AppText style={styles.stadiumText} numberOfLines={1}>
            {record.stadiumName}
          </AppText>
          <AppText style={styles.seatText} numberOfLines={1}>
            {record.seatName}
          </AppText>
        </View>

        <View style={styles.viewTicket}>
          <AppText style={styles.viewTicketText}>티켓 보기</AppText>
          <ChevronRight size={15} color={colors.primary} strokeWidth={2.4} />
        </View>
      </View>
    </Pressable>
  );
}

export default CalendarTicketCard;

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.78,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  win: {
    backgroundColor: colors.primarySoft,
  },
  lose: {
    backgroundColor: '#FDECEC',
  },
  draw: {
    backgroundColor: '#F0F1F2',
  },
  resultText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  winText: {
    color: colors.primary,
  },
  loseText: {
    color: '#C44D4D',
  },
  drawText: {
    color: colors.textSecondary,
  },
  timeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  matchupRow: {
    minHeight: 70,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSide: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 3,
  },
  teamRole: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#777777',
  },
  teamName: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
  scoreRow: {
    width: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    minWidth: 24,
    fontSize: 27,
    lineHeight: 32,
    fontFamily: fonts.black,
    color: colors.text,
    textAlign: 'center',
  },
  scoreDivider: {
    marginHorizontal: 5,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.disabled,
  },
  metaRow: {
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  stadiumText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#666666',
  },
  seatText: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textSecondary,
  },
  viewTicket: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewTicketText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});
