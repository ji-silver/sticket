import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { LineupPlayer } from '../types.ts';

interface TicketLineupSectionProps {
  teamName: string;
  lineup: LineupPlayer[];
}

function TicketLineupSection({ teamName, lineup }: TicketLineupSectionProps) {
  return (
    <View style={styles.section}>
      <AppText style={styles.title} accessibilityRole="header">
        {teamName} 라인업
      </AppText>

      <View style={styles.table}>
        <View style={styles.header}>
          <AppText style={[styles.headerText, styles.orderColumn]}>
            타순
          </AppText>
          <AppText style={[styles.headerText, styles.positionColumn]}>
            POS
          </AppText>
          <AppText style={[styles.headerText, styles.playerColumn]}>
            선수
          </AppText>
        </View>

        {lineup.map(player => (
          <View
            key={player.battingOrder}
            style={styles.row}
            accessible
            accessibilityLabel={`${player.battingOrder}번 타자, ${player.position}, ${player.playerName}`}
          >
            <AppText style={[styles.order, styles.orderColumn]}>
              {player.battingOrder}
            </AppText>
            <AppText style={[styles.position, styles.positionColumn]}>
              {player.position}
            </AppText>
            <AppText
              style={[styles.playerName, styles.playerColumn]}
              numberOfLines={1}
            >
              {player.playerName}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

export default TicketLineupSection;

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  table: {
    marginTop: 16,
  },
  header: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  orderColumn: {
    width: '26%',
  },
  positionColumn: {
    width: '26%',
  },
  playerColumn: {
    width: '48%',
  },
  row: {
    height: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  order: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  position: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.secondary,
  },
  playerName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text,
  },
});
