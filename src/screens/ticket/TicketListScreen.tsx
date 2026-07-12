import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/core';
import { fonts } from '../../styles/fonts.ts';
import AppText from '../../components/common/AppText.tsx';

type SportId = 'baseball' | 'soccer' | 'basketball' | 'volleyball';

interface Ticket {
  id: number;
  matchDate: string;
  stadiumName: string;
  seatName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  barcodeValue?: string;
}

interface TicketListResponse {
  diary: {
    id: number;
    title: string;
    sport: SportId;
  };
  tickets: Ticket[];
}

const mockTicketListResponse: TicketListResponse = {
  diary: {
    id: 1,
    title: '야구',
    sport: 'baseball',
  },
  tickets: [
    // {
    //   id: 1,
    //   matchDate: '2026-04-12',
    //   stadiumName: '고척스카이돔',
    //   seatName: '1루 102구역 8열 12번',
    //   homeTeamName: '키움',
    //   awayTeamName: '두산',
    //   homeScore: 5,
    //   awayScore: 3,
    //   barcodeValue: 'STICKET-20260412-0001',
    // },
    // {
    //   id: 2,
    //   matchDate: '2025-09-21',
    //   stadiumName: '잠실야구장',
    //   seatName: '3루 네이비석 214블록 6열 3번',
    //   homeTeamName: 'LG',
    //   awayTeamName: '키움',
    //   homeScore: 2,
    //   awayScore: 4,
    //   barcodeValue: 'STICKET-20250921-0002',
    // },
  ],
};

function TicketListScreen() {
  const navigation = useNavigation();

  const data = mockTicketListResponse;
  const tickets = data.tickets;
  const diaryTitle = data.diary.title;
  const ticketCount = tickets.length;
  const hasTickets = ticketCount > 0;

  const seasons = Array.from(
    new Set(tickets.map(ticket => new Date(ticket.matchDate).getFullYear())),
  ).sort((a, b) => b - a);

  const [selectedSeason, setSelectedSeason] = useState<number | null>(
    seasons[0] ?? null,
  );

  const handlePressAddTicket = () => {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.hero}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={8}
          >
            <ChevronLeft size={26} color="#111111" strokeWidth={2.4} />
          </Pressable>

          <AppText style={styles.headerTitle}>{diaryTitle} 티켓북</AppText>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.heroTextBox}>
            <View style={styles.ticketCountRow}>
              <AppText style={styles.ticketCountNumber}>{ticketCount}</AppText>

              <View style={styles.ticketCountTextBox}>
                <AppText style={styles.ticketCountUnit}>개의</AppText>
                <AppText style={styles.ticketCountTitle}>직관 티켓</AppText>
              </View>
            </View>
          </View>

          {hasTickets && (
            <Pressable style={styles.addButton} onPress={handlePressAddTicket}>
              <Plus size={17} color="#FFFFFF" strokeWidth={2.7} />
              <AppText style={styles.addButtonText}>티켓 추가</AppText>
            </Pressable>
          )}
        </View>

        {hasTickets && seasons.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.seasonList}
          >
            {seasons.map(season => {
              const isSelected = selectedSeason === season;

              return (
                <Pressable
                  key={season}
                  style={[
                    styles.seasonChip,
                    isSelected && styles.seasonChipSelected,
                  ]}
                  onPress={() => setSelectedSeason(season)}
                >
                  <AppText
                    style={[
                      styles.seasonChipText,
                      isSelected && styles.seasonChipTextSelected,
                    ]}
                  >
                    {season}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {hasTickets ? null : (
          <EmptyTicketState onPressAddTicket={handlePressAddTicket} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default TicketListScreen;

function EmptyTicketState({
  onPressAddTicket,
}: {
  onPressAddTicket: () => void;
}) {
  return (
    <View style={styles.emptyTicketCard}>
      <View style={[styles.ticketNotch, styles.ticketNotchLeft]} />
      <View style={[styles.ticketNotch, styles.ticketNotchRight]} />

      <AppText style={styles.emptyTicketTitle}>아직 남긴 티켓이 없어요</AppText>
      <AppText style={styles.emptyTicketDescription}>
        첫 직관 티켓을 추가해보세요
      </AppText>

      <Pressable style={styles.emptyTicketButton} onPress={onPressAddTicket}>
        <Plus size={15} color="#FFFFFF" strokeWidth={2.7} />
        <AppText style={styles.emptyTicketButtonText}>티켓 추가</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  topBar: {
    height: 38,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 34,
    height: 34,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 2,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#111111',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroTextBox: {
    flex: 1,
  },
  addButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ticketCountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ticketCountNumber: {
    fontSize: 64,
    fontFamily: fonts.black,
    fontWeight: '900',
    color: '#111111',
    lineHeight: 68,
  },
  ticketCountTextBox: {
    marginLeft: 10,
    paddingBottom: 9,
  },
  ticketCountUnit: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 28,
  },
  ticketCountTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 28,
  },
  seasonList: {
    marginTop: 26,
    gap: 8,
  },
  seasonChip: {
    height: 38,
    minWidth: 68,
    paddingHorizontal: 16,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonChipSelected: {
    borderColor: '#111111',
    backgroundColor: '#111111',
  },
  seasonChipText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#777777',
  },
  seasonChipTextSelected: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  emptyTicketCard: {
    position: 'relative',
    minHeight: 214,
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECECEC',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ticketNotch: {
    position: 'absolute',
    top: '50%',
    width: 34,
    height: 34,
    marginTop: -17,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#ECECEC',
    backgroundColor: '#FFFFFF',
  },
  ticketNotchLeft: {
    left: -17,
  },
  ticketNotchRight: {
    right: -17,
  },
  emptyTicketTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#111111',
  },
  emptyTicketDescription: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#9A9A9A',
  },
  emptyTicketButton: {
    height: 40,
    marginTop: 22,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyTicketButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
