import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import { Ticket } from '../../../features/ticket/types.ts';
import { formatTicketSeat } from '../../../features/ticket/seatCatalog.ts';

interface TicketCardProps {
  ticket: Ticket;
  onPress: () => void;
}

const barcodeModules = [
  3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 1, 3, 1, 2, 3, 1, 4, 2, 1, 1, 3,
];

const PERFORATION_DASH_WIDTH = 6;
const PERFORATION_DASH_GAP = 5;

const teamColors: Record<string, string> = {
  키움: '#570514',
  LG: '#C30452',
  한화: '#FC4E00',
  SSG: '#CE0E2D',
  삼성: '#074CA1',
  NC: '#315288',
  KT: '#000000',
  롯데: '#041E42',
  KIA: '#EA0029',
  두산: '#1A1748',
};

function TicketCard({ ticket, onPress }: TicketCardProps) {
  const [perforationWidth, setPerforationWidth] = useState(0);
  const seatDisplay = formatTicketSeat(ticket.seatName, ticket.seatDetail);
  const date = new Date(ticket.matchDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  const perforationDashCount = Math.max(
    1,
    Math.floor(
      (perforationWidth + PERFORATION_DASH_GAP) /
        (PERFORATION_DASH_WIDTH + PERFORATION_DASH_GAP),
    ),
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ticket, pressed && styles.ticketPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${month}월 ${day}일 ${ticket.awayTeamName} 대 ${
        ticket.homeTeamName
      }${ticket.isCancelled ? ', 경기 취소' : ''}, 직관 기록 보기`}
      accessibilityHint="직관 기록 상세 화면으로 이동합니다"
    >
      <View style={styles.contentArea}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <AppText style={styles.metaLabel}>경기일</AppText>
            <AppText style={styles.metaValue}>
              {month}.{day} ({weekday})
            </AppText>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaItem}>
            <AppText style={styles.metaLabel}>시간</AppText>
            <AppText style={styles.metaValue}>{ticket.matchTime}</AppText>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaItem}>
            <AppText style={styles.metaLabel}>경기장</AppText>
            <AppText style={styles.stadiumText} numberOfLines={1}>
              {ticket.stadiumName}
            </AppText>
          </View>
        </View>

        <View style={styles.matchup}>
          <View style={styles.teamSide}>
            <AppText
              style={[
                styles.teamRole,
                {
                  color: teamColors[ticket.awayTeamName] ?? '#AAAAAA',
                },
              ]}
            >
              AWAY
            </AppText>

            <AppText style={styles.teamName} numberOfLines={1}>
              {ticket.awayTeamName}
            </AppText>
          </View>

          <View style={styles.matchupCenter}>
            <AppText
              style={[
                styles.vsText,
                ticket.isCancelled && styles.cancelledText,
              ]}
            >
              {ticket.isCancelled ? '취소' : 'VS'}
            </AppText>
          </View>

          <View style={styles.teamSide}>
            <AppText
              style={[
                styles.teamRole,
                {
                  color: teamColors[ticket.homeTeamName] ?? '#AAAAAA',
                },
              ]}
            >
              HOME
            </AppText>

            <AppText style={styles.teamName} numberOfLines={1}>
              {ticket.homeTeamName}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.perforationWrap}>
        <View style={styles.leftCutout} />

        <View
          onLayout={({ nativeEvent }) =>
            setPerforationWidth(nativeEvent.layout.width)
          }
          style={styles.perforation}
        >
          {Array.from({ length: perforationDashCount }).map((_, index) => (
            <View key={`dash-${index}`} style={styles.perforationDash} />
          ))}
        </View>

        <View style={styles.rightCutout} />
      </View>

      <View
        style={[
          styles.stubArea,
          !seatDisplay && styles.stubAreaWithoutSeat,
        ]}
      >
        {seatDisplay ? (
          <View style={styles.seatBox}>
            <AppText style={styles.stubSeatLabel}>좌석</AppText>
            <AppText style={styles.stubSeat} numberOfLines={1}>
              {seatDisplay}
            </AppText>
          </View>
        ) : null}

        <View style={styles.barcode}>
          {barcodeModules.map((width, index) => (
            <View
              key={`barcode-${index}`}
              style={[
                styles.barcodeBar,
                styles.barcodeBarSpacing,
                index === barcodeModules.length - 1 && styles.barcodeBarLast,
                {
                  width,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

export default TicketCard;

const styles = StyleSheet.create({
  ticket: {
    position: 'relative',
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.025,
    shadowRadius: 6,
    elevation: 1,
  },

  ticketPressed: {
    opacity: 0.82,
  },

  contentArea: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },

  metaRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  metaItem: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },

  metaDivider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 10,
    backgroundColor: colors.border,
  },

  metaLabel: {
    marginBottom: 4,
    fontSize: 9,
    fontFamily: fonts.bold,
    lineHeight: 11,
    color: colors.textSecondary,
  },

  metaValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
    lineHeight: 18,
    color: colors.text,
  },

  stadiumText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    lineHeight: 18,
    color: colors.text,
  },

  matchup: {
    minHeight: 54,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  teamSide: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },

  teamName: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: '#111111',
    textAlign: 'center',
  },

  teamRole: {
    marginBottom: 5,
    fontSize: 9,
    fontFamily: fonts.bold,
    color: '#AAAAAA',
  },

  matchupCenter: {
    width: 56,
    alignItems: 'center',
  },

  vsText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#777777',
  },

  cancelledText: {
    color: colors.textSecondary,
  },

  perforationWrap: {
    position: 'relative',
    height: 22,
    justifyContent: 'center',
  },

  perforation: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: PERFORATION_DASH_GAP,
    overflow: 'hidden',
  },

  perforationDash: {
    width: PERFORATION_DASH_WIDTH,
    height: StyleSheet.hairlineWidth,
    flexShrink: 0,
    backgroundColor: '#D2D2D2',
  },

  leftCutout: {
    position: 'absolute',
    left: -10,
    top: 1,
    zIndex: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: colors.background,
  },

  rightCutout: {
    position: 'absolute',
    right: -10,
    top: 1,
    zIndex: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: colors.background,
  },

  stubArea: {
    minHeight: 50,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  stubAreaWithoutSeat: {
    justifyContent: 'flex-end',
  },

  seatBox: {
    flex: 1,
    minWidth: 0,
  },

  stubSeatLabel: {
    marginBottom: 3,
    fontSize: 8,
    fontFamily: fonts.bold,
    color: colors.textPlaceholder,
  },

  stubSeat: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  barcode: {
    width: 108,
    height: 28,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
  },

  barcodeBar: {
    height: 28,
    backgroundColor: '#111111',
  },

  barcodeBarSpacing: {
    marginRight: 1,
  },

  barcodeBarLast: {
    marginRight: 0,
  },
});
