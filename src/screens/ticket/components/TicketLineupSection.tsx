import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import { LineupPlayer } from '../../../features/ticket/types.ts';

interface TicketLineupSectionProps {
  awayTeamName: string;
  homeTeamName: string;
  awayLineup: LineupPlayer[];
  homeLineup: LineupPlayer[];
  favoriteTeamName?: string;
}

type LineupSide = 'away' | 'home';

function TicketLineupSection({
  awayTeamName,
  homeTeamName,
  awayLineup,
  homeLineup,
  favoriteTeamName,
}: TicketLineupSectionProps) {
  const preferredSide: LineupSide =
    favoriteTeamName === homeTeamName ? 'home' : 'away';
  const [selectedSide, setSelectedSide] = useState<LineupSide>(preferredSide);
  const [pageWidth, setPageWidth] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const pageStyle = useMemo(() => ({ width: pageWidth }), [pageWidth]);
  useEffect(() => {
    setSelectedSide(preferredSide);
    pagerRef.current?.scrollTo({
      x: preferredSide === 'away' ? 0 : pageWidth,
      animated: false,
    });
  }, [pageWidth, preferredSide]);

  const handleSelectSide = (side: LineupSide) => {
    setSelectedSide(side);
    pagerRef.current?.scrollTo({
      x: side === 'away' ? 0 : pageWidth,
      animated: true,
    });
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const width = event.nativeEvent.layoutMeasurement.width;

    if (width <= 0) return;

    setSelectedSide(
      Math.round(event.nativeEvent.contentOffset.x / width) === 0
        ? 'away'
        : 'home',
    );
  };

  return (
    <View style={styles.section}>
      <AppText style={styles.title} accessibilityRole="header">
        선발 라인업
      </AppText>

      <View style={styles.tabBar} accessibilityRole="tablist">
        <LineupTab
          teamName={awayTeamName}
          selected={selectedSide === 'away'}
          onPress={() => handleSelectSide('away')}
        />
        <LineupTab
          teamName={homeTeamName}
          selected={selectedSide === 'home'}
          onPress={() => handleSelectSide('home')}
        />
      </View>

      <View
        style={styles.pagerViewport}
        onLayout={event => setPageWidth(event.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={pagerRef}
          testID="lineup-pager"
          horizontal
          pagingEnabled
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          contentContainerStyle={styles.pagerContent}
        >
          <View style={pageStyle}>
            <LineupTable lineup={awayLineup} />
          </View>
          <View style={pageStyle}>
            <LineupTable lineup={homeLineup} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function LineupTab({
  teamName,
  selected,
  onPress,
}: {
  teamName: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tab,
        selected && styles.tabSelected,
        pressed && styles.tabPressed,
      ]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={`${teamName} 라인업`}
      accessibilityState={{ selected }}
    >
      <AppText style={[styles.tabTeam, selected && styles.tabTeamSelected]}>
        {teamName}
      </AppText>
    </Pressable>
  );
}

function LineupTable({ lineup }: { lineup: LineupPlayer[] }) {
  return (
    <View style={styles.table}>
      <View style={styles.header}>
        <AppText style={[styles.headerText, styles.orderColumn]}>타순</AppText>
        <AppText style={[styles.headerText, styles.positionColumn]}>
          POS
        </AppText>
        <AppText style={[styles.headerText, styles.playerColumn]}>선수</AppText>
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
  tabBar: {
    height: 44,
    marginTop: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabSelected: {
    borderBottomColor: colors.primary,
  },
  tabPressed: {
    opacity: 0.65,
  },
  tabTeam: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  tabTeamSelected: {
    color: colors.primary,
  },
  pagerViewport: {
    marginTop: 12,
    overflow: 'hidden',
  },
  pagerContent: {
    alignItems: 'flex-start',
  },
  table: {
    width: '100%',
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
