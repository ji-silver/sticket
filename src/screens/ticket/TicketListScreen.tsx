import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/core';

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
    {
      id: 1,
      matchDate: '2026-04-12',
      stadiumName: '고척스카이돔',
      seatName: '1루 102구역 8열 12번',
      homeTeamName: '키움',
      awayTeamName: '두산',
      homeScore: 5,
      awayScore: 3,
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
      barcodeValue: 'STICKET-20250921-0002',
    },
  ],
};

function TicketListScreen() {
  const navigation = useNavigation();

  const data = mockTicketListResponse;
  const tickets = data.tickets;
  const diaryTitle = data.diary.title;
  const ticketCount = tickets.length;

  const seasons = Array.from(
    new Set(tickets.map(ticket => new Date(ticket.matchDate).getFullYear())),
  ).sort((a, b) => b - a);

  const [selectedSeason, setSelectedSeason] = useState<number | null>(
    seasons[0] ?? null,
  );

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

          <Text style={styles.headerTitle}>{diaryTitle} 티켓북</Text>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.heroTextBox}>
            <View style={styles.ticketCountRow}>
              <Text style={styles.ticketCountNumber}>{ticketCount}</Text>

              <View style={styles.ticketCountTextBox}>
                <Text style={styles.ticketCountUnit}>개의</Text>
                <Text style={styles.ticketCountTitle}>직관 티켓</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.addButton}>
            <Plus size={17} color="#FFFFFF" strokeWidth={2.7} />
            <Text style={styles.addButtonText}>티켓 추가</Text>
          </Pressable>
        </View>

        {seasons.length > 0 && (
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
                  <Text
                    style={[
                      styles.seasonChipText,
                      isSelected && styles.seasonChipTextSelected,
                    ]}
                  >
                    {season}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

export default TicketListScreen;

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
    fontSize: 19,
    fontWeight: '900',
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
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ticketCountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ticketCountNumber: {
    fontSize: 64,
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
    fontWeight: '900',
    color: '#111111',
    lineHeight: 28,
  },
  ticketCountTitle: {
    fontSize: 24,
    fontWeight: '900',
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
    fontWeight: '800',
    color: '#777777',
  },
  seasonChipTextSelected: {
    color: '#FFFFFF',
  },
});
