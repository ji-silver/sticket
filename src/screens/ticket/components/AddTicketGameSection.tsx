import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import EmptyCard from '../../../components/common/EmptyCard.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { KboGame } from '../../../features/game/types.ts';

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
  return (
    <View style={styles.gameSection}>
      <View style={styles.gameSectionHeader}>
        <AppText style={styles.sectionTitle}>어떤 경기를 봤나요?</AppText>
      </View>

      {isLoadingGames ? (
        <View style={styles.gameLoadingCard}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : gameLoadError ? (
        <EmptyCard
          title="경기 정보를 불러오지 못했어요"
          description={gameLoadError}
          style={styles.emptyCard}
        />
      ) : games.length > 0 ? (
        <View style={styles.gameList}>
          {games.map(game => {
            const isSelected = selectedGameId === game.id;

            return (
              <Pressable
                key={game.id}
                style={({ pressed }) => [
                  styles.gameCard,
                  isSelected && styles.gameCardSelected,
                  pressed && styles.gameCardPressed,
                ]}
                onPress={() => onPressGame(game.id)}
                accessibilityRole="button"
                accessibilityLabel={`${game.awayTeamName} 원정 대 ${game.homeTeamName} 홈, ${game.time}, ${game.stadiumName}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.matchupRow}>
                  <View style={styles.teamSide}>
                    <AppText style={styles.teamRole}>AWAY</AppText>
                    <AppText style={styles.teamName} numberOfLines={1}>
                      {game.awayTeamName}
                    </AppText>
                  </View>

                  <AppText style={styles.vsText}>VS</AppText>

                  <View style={styles.teamSide}>
                    <AppText style={styles.teamRole}>HOME</AppText>
                    <AppText style={styles.teamName} numberOfLines={1}>
                      {game.homeTeamName}
                    </AppText>
                  </View>
                </View>

                <View style={styles.gameMetaRow}>
                  <View style={styles.gameMetaContent}>
                    <AppText style={styles.gameTime}>{game.time}</AppText>

                    <View style={styles.metaDot} />

                    <AppText style={styles.stadiumName} numberOfLines={1}>
                      {game.stadiumName}
                    </AppText>
                  </View>
                </View>
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
    gap: 10,
  },
  gameLoadingCard: {
    minHeight: 156,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameCard: {
    minHeight: 122,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    gap: 14,
  },
  gameCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  gameCardPressed: {
    opacity: 0.78,
  },
  gameMetaRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameMetaContent: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gameTime: {
    flexShrink: 0,
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.disabled,
  },
  stadiumName: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  matchupRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSide: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 3,
  },
  teamRole: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.secondary,
  },
  teamName: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
  vsText: {
    width: 36,
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.secondary,
    textAlign: 'center',
  },
  emptyCard: {
    minHeight: 156,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
