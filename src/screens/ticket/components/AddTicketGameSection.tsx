import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import AppSkeleton from '../../../components/common/AppSkeleton.tsx';
import AppText from '../../../components/common/AppText.tsx';
import EmptyCard from '../../../components/common/EmptyCard.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { KboGame } from '../../../features/game/types.ts';

const GAME_SKELETON_COUNT = 5;

interface AddTicketGameSectionProps {
  games: KboGame[];
  isLoadingGames: boolean;
  gameLoadError: string | null;
  selectedGameId: string | null;
  onPressGame: (gameId: string) => void;
}

export default function AddTicketGameSection({
  games,
  isLoadingGames,
  gameLoadError,
  selectedGameId,
  onPressGame,
}: AddTicketGameSectionProps) {
  const [isChoosingGame, setIsChoosingGame] = useState(false);
  const selectedGame = games.find(game => game.id === selectedGameId);
  // 자동 선택이나 OCR로 정해진 경기도 같은 요약을 사용한다.
  // 선택 목록을 여는 상태만 여기서 관리하고 실제 경기 선택은 부모 화면에 맡긴다.
  const isSummary = Boolean(selectedGame) && !isChoosingGame;
  const visibleGames = isSummary && selectedGame ? [selectedGame] : games;
  const matchupCounts = games.reduce<Record<string, number>>((counts, game) => {
    const matchup = `${game.awayTeamName}-${game.homeTeamName}`;
    counts[matchup] = (counts[matchup] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <View style={styles.gameSection}>
      <View style={styles.gameSectionHeader}>
        <AppText style={styles.sectionTitle}>어떤 경기를 봤나요?</AppText>
      </View>

      {isLoadingGames ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="경기 목록을 불러오는 중"
          style={styles.gameList}
        >
          {Array.from({ length: GAME_SKELETON_COUNT }, (_, index) => (
            <View
              key={`game-skeleton-${index}`}
              style={[
                styles.gameRow,
                index === GAME_SKELETON_COUNT - 1 && styles.lastRow,
              ]}
            >
              <AppSkeleton width="100%" height={40} borderRadius={6} />
            </View>
          ))}
        </View>
      ) : gameLoadError ? (
        <EmptyCard
          title="경기 정보를 불러오지 못했어요"
          description={gameLoadError}
          style={styles.emptyCard}
        />
      ) : games.length > 0 ? (
        <View style={styles.gameList}>
          {visibleGames.map((game, index) => {
            const isSelected = selectedGameId === game.id;
            const matchup = `${game.awayTeamName}-${game.homeTeamName}`;
            const gameNumber =
              matchupCounts[matchup] > 1
                ? game.id.match(/-(\d+)$/)?.[1]
                : undefined;
            const timeText = gameNumber
              ? `${gameNumber}차전 ${game.time}`
              : game.time;

            return (
              <Pressable
                key={game.id}
                style={({ pressed }) => [
                  styles.gameRow,
                  index === visibleGames.length - 1 && styles.lastRow,
                  pressed && styles.gameRowPressed,
                ]}
                onPress={() => {
                  if (isSummary) {
                    setIsChoosingGame(true);
                    return;
                  }
                  onPressGame(game.id);
                  setIsChoosingGame(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${game.awayTeamName} 원정 대 ${
                  game.homeTeamName
                } 홈, ${timeText}, ${game.stadiumName}${
                  isSummary ? ', 경기 변경' : ''
                }`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.gameInfo}>
                  <View style={styles.matchupRow}>
                    <AppText style={styles.teamName} numberOfLines={1}>
                      {game.awayTeamName}
                    </AppText>
                    <AppText style={styles.vsText}>vs</AppText>
                    <AppText style={styles.teamName} numberOfLines={1}>
                      {game.homeTeamName}
                    </AppText>
                  </View>
                  <View style={styles.gameMetaRow}>
                    <AppText style={styles.gameTime}>{timeText}</AppText>
                    <AppText style={styles.stadiumName} numberOfLines={1}>
                      {game.stadiumName}
                    </AppText>
                  </View>
                </View>
                {isSummary ? (
                  <View style={styles.changeAction}>
                    <AppText style={styles.changeText}>변경</AppText>
                    <ChevronDown
                      size={16}
                      color={colors.primary}
                      strokeWidth={2}
                    />
                  </View>
                ) : isSelected ? (
                  <Check size={20} color={colors.primary} strokeWidth={2} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <EmptyCard
          title="이 날짜에는 경기가 없어요"
          description="다른 날짜를 선택해 직관 경기를 찾아보세요"
          style={styles.emptyCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  gameSection: {
    marginTop: 12,
  },
  gameSectionHeader: {
    marginBottom: 12,
  },
  gameList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  gameRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  gameRowPressed: {
    backgroundColor: colors.background,
  },
  gameInfo: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    flexShrink: 1,
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  vsText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  gameMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gameTime: {
    flexShrink: 0,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  stadiumName: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  changeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  emptyCard: {
    minHeight: 156,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
