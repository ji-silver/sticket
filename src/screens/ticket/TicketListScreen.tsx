import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/core';
import { fonts } from '../../styles/fonts.ts';
import AppText from '../../components/common/AppText.tsx';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { colors } from '../../styles/colors.ts';
import FilterChip from '../../components/common/FilterChip.tsx';
import InlineActionButton from '../../components/common/InlineActionButton.tsx';
import ScreenHeader from '../../components/common/ScreenHeader.tsx';
import { Ticket } from './types.ts';
import { getTickets } from '../../features/ticket/ticket.service.ts';
import TicketCard from './components/TicketCard.tsx';

function TicketListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const diaryTitle = '야구';
  const ticketCount = tickets.length;
  const hasTickets = ticketCount > 0;

  // useEffect는 컴포넌트 생성 기준, useFocusEffect는 화면이 사용장게 다시 보일때마다 실행
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadTickets = async () => {
        setIsLoading(true);

        try {
          const loadedTickets = await getTickets();

          if (isActive) {
            setTickets(loadedTickets);
          }
        } catch (error) {
          console.error('티켓 목록을 불러오지 못했습니다.', error);

          if (isActive) {
            Alert.alert(
              '티켓 목록을 불러오지 못했어요',
              '잠시 후 다시 시도해 주세요.',
            );
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      loadTickets();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const seasons = Array.from(
    new Set(tickets.map(ticket => new Date(ticket.matchDate).getFullYear())),
  ).sort((firstSeason, secondSeason) => secondSeason - firstSeason);

  const activeSeason =
    selectedSeason !== null && seasons.includes(selectedSeason)
      ? selectedSeason
      : seasons[0] ?? null;

  const filteredTickets =
    activeSeason === null
      ? tickets
      : tickets.filter(
          ticket => new Date(ticket.matchDate).getFullYear() === activeSeason,
        );

  const handlePressAddTicket = () => {
    navigation.navigate('AddTicket');
  };
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={`${diaryTitle} 티켓북`}
        onPressBack={() => navigation.goBack()}
        right={
          hasTickets ? (
            <InlineActionButton
              label="추가"
              tone="primary"
              onPress={handlePressAddTicket}
              accessibilityLabel="티켓 추가"
              icon={<Plus size={16} color={colors.primary} strokeWidth={2.5} />}
            />
          ) : undefined
        }
      />

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
                const isSelected = activeSeason === season;

                return (
                  <FilterChip
                    key={season}
                    label={season}
                    selected={isSelected}
                    onPress={() => setSelectedSeason(season)}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.contentContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size={'small'} color={colors.primary} />
            </View>
          ) : hasTickets ? (
            <View style={styles.ticketList}>
              {filteredTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() =>
                    navigation.navigate('TicketDetail', { ticket })
                  }
                />
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
          <Plus size={15} color={colors.onPrimary} strokeWidth={2.7} />
          <AppText style={styles.emptyTicketButtonText}>티켓 추가</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: colors.surface,
  },
  ticketCountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ticketCountNumber: {
    fontSize: 64,
    fontFamily: fonts.black,
    fontWeight: '900',
    color: colors.text,
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
    color: colors.text,
    lineHeight: 28,
  },
  ticketCountTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 28,
  },
  seasonList: {
    paddingHorizontal: 24,
    gap: 10,
  },
  seasonBar: {
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F1F1',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  loadingContainer: {
    minHeight: 214,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketList: {
    gap: 16,
  },
  emptyTicketCard: {
    position: 'relative',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 6,
    elevation: 1,
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
    left: -10,
    top: '50%',
    zIndex: 3,
    width: 20,
    height: 20,
    marginTop: -10,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  emptyRightCutout: {
    position: 'absolute',
    right: -10,
    top: '50%',
    zIndex: 3,
    width: 20,
    height: 20,
    marginTop: -10,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  emptyTicketTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
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
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyTicketButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
