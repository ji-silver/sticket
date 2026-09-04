import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/core';
import { fonts } from '../../styles/fonts.ts';
import AppButton from '../../components/common/AppButton.tsx';
import AppText from '../../components/common/AppText.tsx';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { colors } from '../../styles/colors.ts';
import FilterChip from '../../components/common/FilterChip.tsx';
import InlineActionButton from '../../components/common/InlineActionButton.tsx';
import ScreenHeader from '../../components/common/ScreenHeader.tsx';
import ResponsiveContent from '../../components/common/ResponsiveContent.tsx';
import {
  useGetTicketsBySeason,
  useGetTicketSeasonSummaries,
} from '../../features/ticket/api/useGetTickets';
import { Ticket } from '../../features/ticket/types.ts';
import TicketCard from './components/TicketCard.tsx';

const MONTH_OVERLAY_HIDE_DELAY = 700;

function getMonthLabel(ticket: Ticket | undefined) {
  if (!ticket) {
    return null;
  }

  return `${new Date(ticket.matchDate).getMonth() + 1}월`;
}

function TicketListScreen() {
  const horizontalPadding = 20;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    data: seasonSummaries = [],
    isLoading: isLoadingSeasons,
    error: seasonError,
  } = useGetTicketSeasonSummaries();
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const seasons = seasonSummaries.map(summary => summary.season);
  const activeSeason =
    selectedSeason !== null && seasons.includes(selectedSeason)
      ? selectedSeason
      : seasons[0] ?? null;
  const {
    data: tickets = [],
    isLoading: isLoadingTickets,
    error: ticketsError,
  } = useGetTicketsBySeason(activeSeason);
  const [visibleMonth, setVisibleMonth] = useState<string | null>(null);
  const visibleMonthRef = useRef<string | null>(null);
  const monthOverlayOpacity = useRef(new Animated.Value(0)).current;
  const monthOverlayHideTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const diaryTitle = '야구';
  const ticketCount = seasonSummaries.reduce(
    (count, summary) => count + summary.ticketCount,
    0,
  );
  const hasTickets = ticketCount > 0;
  const error = seasonError ?? ticketsError;

  useEffect(() => {
    if (!error) {
      return;
    }

    console.error('티켓 목록을 불러오지 못했습니다.', error);
    Alert.alert('티켓 목록을 불러오지 못했어요', '잠시 후 다시 시도해 주세요.');
  }, [error]);

  const clearMonthOverlayHideTimer = () => {
    if (monthOverlayHideTimer.current) {
      clearTimeout(monthOverlayHideTimer.current);
      monthOverlayHideTimer.current = null;
    }
  };

  const showMonthOverlay = () => {
    clearMonthOverlayHideTimer();
    monthOverlayOpacity.stopAnimation();
    Animated.timing(monthOverlayOpacity, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const hideMonthOverlay = () => {
    clearMonthOverlayHideTimer();
    monthOverlayHideTimer.current = setTimeout(() => {
      Animated.timing(monthOverlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }, MONTH_OVERLAY_HIDE_DELAY);
  };

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisibleTicket = viewableItems.find(
        item => item.isViewable && typeof item.item?.matchDate === 'string',
      )?.item as Ticket | undefined;
      const nextVisibleMonth = getMonthLabel(firstVisibleTicket);

      if (visibleMonthRef.current !== nextVisibleMonth) {
        visibleMonthRef.current = nextVisibleMonth;
        setVisibleMonth(nextVisibleMonth);
      }
    },
  ).current;

  useEffect(() => {
    const firstMonth = getMonthLabel(tickets[0]);
    visibleMonthRef.current = firstMonth;
    setVisibleMonth(firstMonth);
  }, [tickets]);

  useEffect(
    () => () => {
      clearMonthOverlayHideTimer();
      monthOverlayOpacity.stopAnimation();
    },
    [monthOverlayOpacity],
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

      <SectionList
        style={styles.content}
        sections={hasTickets ? [{ data: tickets }] : []}
        keyExtractor={ticket => ticket.id}
        stickySectionHeadersEnabled={hasTickets}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        onScrollBeginDrag={showMonthOverlay}
        onScrollEndDrag={hideMonthOverlay}
        onMomentumScrollBegin={showMonthOverlay}
        onMomentumScrollEnd={hideMonthOverlay}
        scrollEventThrottle={32}
        ListHeaderComponent={
          <View style={styles.hero}>
            <ResponsiveContent
              style={[
                styles.horizontalContent,
                { paddingHorizontal: horizontalPadding },
              ]}
            >
              <View style={styles.ticketCountRow}>
                <AppText style={styles.ticketCountNumber}>
                  {ticketCount}
                </AppText>

                <View style={styles.ticketCountTextBox}>
                  <AppText style={styles.ticketCountUnit}>개의</AppText>
                  <AppText style={styles.ticketCountTitle}>직관 티켓</AppText>
                </View>
              </View>
            </ResponsiveContent>
          </View>
        }
        renderSectionHeader={() => (
          <View style={styles.seasonBar}>
            <ResponsiveContent>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.seasonList,
                  { paddingHorizontal: horizontalPadding },
                ]}
              >
                {seasons.map(season => (
                  <FilterChip
                    key={season}
                    label={season}
                    selected={activeSeason === season}
                    onPress={() => setSelectedSeason(season)}
                  />
                ))}
              </ScrollView>
            </ResponsiveContent>
          </View>
        )}
        renderItem={({ item: ticket, index }) => (
          <ResponsiveContent
            style={[
              styles.horizontalContent,
              { paddingHorizontal: horizontalPadding },
              index === 0 && styles.firstTicket,
            ]}
          >
            <View style={styles.ticketItem}>
              <TicketCard
                ticket={ticket}
                onPress={() =>
                  navigation.navigate('TicketDetail', {
                    ticketId: ticket.id,
                  })
                }
              />
            </View>
          </ResponsiveContent>
        )}
        ListEmptyComponent={
          <ResponsiveContent
            style={[
              styles.horizontalContent,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <View style={styles.contentContainer}>
              {isLoadingSeasons || isLoadingTickets ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size={'small'} color={colors.primary} />
                </View>
              ) : (
                <EmptyTicketState onPressAddTicket={handlePressAddTicket} />
              )}
            </View>
          </ResponsiveContent>
        }
        ListFooterComponent={<View style={styles.listFooter} />}
      />

      {hasTickets && visibleMonth ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.monthOverlay, { opacity: monthOverlayOpacity }]}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          <AppText style={styles.monthOverlayText}>{visibleMonth}</AppText>
        </Animated.View>
      ) : null}
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

        <AppButton style={styles.emptyTicketButton} onPress={onPressAddTicket}>
          <Plus size={15} color={colors.onPrimary} strokeWidth={2.7} />
          <AppText style={styles.emptyTicketButtonText}>티켓 추가</AppText>
        </AppButton>
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
    paddingHorizontal: 12,
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
    paddingTop: 28,
    paddingBottom: 32,
  },
  horizontalContent: {
    paddingHorizontal: 12,
  },
  loadingContainer: {
    minHeight: 214,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstTicket: {
    paddingTop: 28,
  },
  ticketItem: {
    marginBottom: 16,
  },
  listFooter: {
    height: 16,
  },
  monthOverlay: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    marginTop: -22,
    minWidth: 64,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.76)',
  },
  monthOverlayText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
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
