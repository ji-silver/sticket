import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import { fonts } from '../../../styles/fonts.ts';
import { Ticket } from '../types.ts';

interface TicketCardProps {
  ticket: Ticket;
}

const barcodeModules = [
  3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 1, 3, 1, 2, 3, 1, 4, 2, 1, 1, 3,
];

const perforationDashes = Array.from({ length: 28 });

function TicketCard({ ticket }: TicketCardProps) {
  const date = new Date(ticket.matchDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

  return (
    <View style={styles.ticket}>
      <View style={styles.contentArea}>
        <View style={styles.metaRow}>
          <AppText style={styles.dateText}>
            {month}.{day} {weekday} {ticket.matchTime}
          </AppText>

          <AppText style={styles.stadiumText} numberOfLines={1}>
            {ticket.stadiumName}
          </AppText>
        </View>

        <View style={styles.scoreBoard}>
          <View style={styles.teamSide}>
            <AppText style={styles.teamName} numberOfLines={1}>
              {ticket.awayTeamName}
            </AppText>
            <AppText style={styles.teamRole}>AWAY</AppText>
          </View>

          <View style={styles.scoreCenter}>
            <View style={styles.scoreRow}>
              <AppText style={styles.scoreText}>{ticket.awayScore}</AppText>
              <AppText style={styles.scoreDivider}>:</AppText>
              <AppText style={styles.scoreText}>{ticket.homeScore}</AppText>
            </View>
            <AppText style={styles.vsText}>VS</AppText>
          </View>

          <View style={styles.teamSide}>
            <AppText style={styles.teamName} numberOfLines={1}>
              {ticket.homeTeamName}
            </AppText>
            <AppText style={styles.teamRole}>HOME</AppText>
          </View>
        </View>
      </View>

      {/* 절취선 및 커팅 */}
      <View style={styles.perforationWrap}>
        <View style={styles.leftCutout} />

        <View style={styles.perforation}>
          {perforationDashes.map((_, index) => (
            <View key={`dash-${index}`} style={styles.perforationDash} />
          ))}
        </View>

        <View style={styles.rightCutout} />
      </View>

      <View style={styles.stubArea}>
        <View style={styles.seatBox}>
          <AppText style={styles.stubSeat} numberOfLines={1}>
            {ticket.seatName}
          </AppText>
        </View>

        {/* 바코드 */}
        <View style={styles.barcode}>
          {barcodeModules.map((width, index) => (
            <View
              key={`barcode-${index}`}
              style={[
                styles.barcodeBar,
                {
                  width,
                  marginRight: index === barcodeModules.length - 1 ? 0 : 1,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export default TicketCard;

const styles = StyleSheet.create({
  ticket: {
    position: 'relative',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  contentArea: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dateText: {
    flexShrink: 0,
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#777777',
  },

  stadiumText: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#777777',
  },

  scoreBoard: {
    marginTop: 12,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
  },

  teamSide: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },

  teamName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#111111',
    textAlign: 'center',
  },

  teamRole: {
    marginTop: 5,
    fontSize: 9,
    fontFamily: fonts.bold,
    color: '#AAAAAA',
  },

  scoreCenter: {
    width: 84,
    alignItems: 'center',
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  scoreText: {
    fontSize: 25,
    lineHeight: 29,
    fontFamily: fonts.black,
    color: '#111111',
  },

  scoreDivider: {
    marginHorizontal: 6,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#B8B8B8',
  },

  vsText: {
    marginTop: 2,
    fontSize: 9,
    fontFamily: fonts.bold,
    color: '#B8B8B8',
  },

  perforationWrap: {
    position: 'relative',
    height: 22,
    justifyContent: 'center',
  },

  perforation: {
    marginHorizontal: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  perforationDash: {
    width: 6,
    height: 1,
    backgroundColor: '#D2D2D2',
  },

  leftCutout: {
    position: 'absolute',
    left: -12,
    top: -1,
    zIndex: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
  },

  rightCutout: {
    position: 'absolute',
    right: -12,
    top: -1,
    zIndex: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
  },

  stubArea: {
    minHeight: 50,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },

  seatBox: {
    flex: 1,
    minWidth: 0,
  },

  stubSeat: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#666666',
  },

  barcode: {
    width: 108,
    height: 32,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
  },

  barcodeBar: {
    height: 32,
    backgroundColor: '#111111',
  },
});
