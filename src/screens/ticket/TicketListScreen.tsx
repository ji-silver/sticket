import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/core';
import { fonts } from '../../styles/fonts.ts';
import AppText from '../../components/common/AppText.tsx';
import TicketCard from './components/TicketCard.tsx';
import type { SportId, Ticket } from './types.ts';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';

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
    {
      id: 1,
      matchDate: '2026-04-12',
      stadiumName: '고척스카이돔',
      seatName: '1루 102구역 8열 12번',
      homeTeamName: '키움',
      awayTeamName: '두산',
      homeScore: 5,
      awayScore: 3,
      matchTime: '14:00',

      barcodeValue: 'STICKET-20260412-0001',
    },
    {
      id: 2,
      matchDate: '2025-09-21',
      stadiumName: '잠실야구장',
      seatName: '3루 네이비석 214블록 6열 3번',
      homeTeamName: 'LG',
      awayTeamName: '키움',
      homeScore: 2,
      awayScore: 4,
      matchTime: '14:00',
    },
    {
      id: 3,
      matchDate: '2025-09-21',
      stadiumName: '잠실야구장',
      seatName: '3루 네이비석 214블록 6열 3번',
      homeTeamName: 'LG',
      awayTeamName: '키움',
      homeScore: 2,
      awayScore: 4,
      matchTime: '14:00',
    },
    {
      id: 4,
      matchDate: '2025-09-21',
      stadiumName: '잠실야구장',
      seatName: '3루 네이비석 214블록 6열 3번',
      homeTeamName: 'LG',
      awayTeamName: '키움',
      homeScore: 2,
      awayScore: 4,
      matchTime: '14:00',
    },
    {
      id: 5,
      matchDate: '2025-09-21',
      stadiumName: '잠실야구장',
      seatName: '3루 네이비석 214블록 6열 3번',
      homeTeamName: 'LG',
      awayTeamName: '키움',
      homeScore: 2,
      awayScore: 4,
      matchTime: '14:00',
    },
  ],
};

function TicketListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  const filteredTickets =
    selectedSeason === null
      ? tickets
      : tickets.filter(
          ticket => new Date(ticket.matchDate).getFullYear() === selectedSeason,
        );

  // 티켓 추가
  const handlePressAddTicket = () => {
    navigation.navigate('AddTicket');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <ChevronLeft size={26} color="#111111" strokeWidth={2.4} />
        </Pressable>

        <AppText style={styles.headerTitle}>{diaryTitle} 티켓북</AppText>

        {hasTickets && (
          <Pressable
            style={styles.headerAddButton}
            onPress={handlePressAddTicket}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="티켓 추가"
          >
            <Plus size={16} color="#111111" strokeWidth={2.5} />
            <AppText style={styles.headerAddButtonText}>추가</AppText>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.content}
        stickyHeaderIndices={hasTickets ? [1] : []}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.ticketCountRow}>
            <AppText style={styles.ticketCountNumber}>{ticketCount}</AppText>

            <View style={styles.ticketCountTextBox}>
              <AppText style={styles.ticketCountUnit}>개의</AppText>
              <AppText style={styles.ticketCountTitle}>직관 티켓</AppText>
            </View>
          </View>
        </View>

        {hasTickets && seasons.length > 0 && (
          <View style={styles.seasonBar}>
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
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
          </View>
        )}

        <View style={styles.contentContainer}>
          {hasTickets ? (
            <View style={styles.ticketList}>
              {filteredTickets.map(ticket => (
                <TicketCard key={String(ticket.id)} ticket={ticket} />
              ))}
            </View>
          ) : (
            <EmptyTicketState onPressAddTicket={handlePressAddTicket} />
          )}
        </View>
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
      <View style={styles.emptyLeftCutout} />
      <View style={styles.emptyRightCutout} />

      <View style={styles.emptyTicketContent}>
        <AppText style={styles.emptyTicketTitle}>
          아직 남긴 티켓이 없어요
        </AppText>
        <AppText style={styles.emptyTicketDescription}>
          첫 직관 티켓을 추가해보세요
        </AppText>

        <Pressable style={styles.emptyTicketButton} onPress={onPressAddTicket}>
          <Plus size={15} color="#FFFFFF" strokeWidth={2.7} />
          <AppText style={styles.emptyTicketButtonText}>티켓 추가</AppText>
        </Pressable>
      </View>
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
    paddingTop: 22,
    paddingBottom: 26,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    height: 52,
    paddingHorizontal: 24,
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
    flex: 1,
    marginLeft: 2,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#111111',
  },
  headerAddButton: {
    minWidth: 44,
    height: 44,
    marginRight: -4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  headerAddButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#111111',
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
    paddingHorizontal: 24,
    gap: 8,
  },
  seasonBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F1F1',
    backgroundColor: '#FFFFFF',
  },
  seasonChip: {
    height: 34,
    minWidth: 68,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 17,
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
    backgroundColor: '#F7F7F7',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  ticketList: {
    gap: 16,
  },
  emptyTicketCard: {
    position: 'relative',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTicketContent: {
    minHeight: 214,
    paddingHorizontal: 24,
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLeftCutout: {
    position: 'absolute',
    left: -12,
    top: '50%',
    zIndex: 3,
    width: 24,
    height: 24,
    marginTop: -12,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
  },
  emptyRightCutout: {
    position: 'absolute',
    right: -12,
    top: '50%',
    zIndex: 3,
    width: 24,
    height: 24,
    marginTop: -12,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
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
