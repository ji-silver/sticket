import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton.tsx';
import AppText from '../../components/common/AppText.tsx';
import { fonts } from '../../styles/fonts.ts';
import { useNavigation, useRoute } from '@react-navigation/core';
import { useEffect, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DateData } from 'react-native-calendars';
import { colors } from '../../styles/colors.ts';
import ScreenHeader from '../../components/common/ScreenHeader.tsx';
import ResponsiveContent from '../../components/common/ResponsiveContent.tsx';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import OriginalTicketImageField, {
  SelectedOriginalTicketImage,
} from './components/OriginalTicketImageField.tsx';
import { useGetGamesByDate } from '../../features/game/api/useGetGamesByDate';
import { useAuth } from '../../features/auth/AuthProvider.tsx';
import { getTodayInKorea } from '../../lib/date.ts';
import type { RouteProp } from '@react-navigation/native';
import { useCreateTicket } from '../../features/ticket/api/useCreateTicket';
import AddTicketDateSection from './components/AddTicketDateSection.tsx';
import AddTicketGameSection from './components/AddTicketGameSection.tsx';
import type { UserProfile } from '../../features/auth/auth.types.ts';
import type { KboGame } from '../../features/game/types.ts';

type AddTicketRouteProp = RouteProp<RootStackParamList, 'AddTicket'>;

function getSeasonTicketSeatName(
  profile: UserProfile | null,
  game: KboGame | undefined,
  currentSeason: number,
) {
  if (
    !game ||
    !profile?.season_ticket_seat_name ||
    profile.season_ticket_season !== currentSeason ||
    profile.season_ticket_team_id !== game.homeTeamId ||
    profile.favorite_team_id !== game.homeTeamId ||
    game.season !== currentSeason ||
    game.seriesType !== 'REGULAR'
  ) {
    return '';
  }

  return profile.season_ticket_seat_name;
}

function AddTicketScreen() {
  const horizontalPadding = 20;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AddTicketRouteProp>();
  const { profile } = useAuth();
  const favoriteTeamName = profile?.favorite_team?.short_name;

  const today = getTodayInKorea();
  const currentSeason = Number(today.slice(0, 4));
  const routeInitialDate = route.params?.initialDate;
  const initialDate =
    routeInitialDate && routeInitialDate <= today ? routeInitialDate : '';

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(!initialDate);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [seatName, setSeatName] = useState('');
  const queryDate = !isCalendarOpen && selectedDate ? selectedDate : '';

  const {
    data: games = [],
    isLoading: isLoadingGames,
    isError,
  } = useGetGamesByDate(queryDate);
  const gameLoadError = isError ? '날짜를 다시 선택해 재시도해 주세요.' : null;

  useEffect(() => {
    if (games.length > 0 && favoriteTeamName && !selectedGameId) {
      const favoriteTeamGames = games.filter(
        game =>
          game.awayTeamName === favoriteTeamName ||
          game.homeTeamName === favoriteTeamName,
      );
      if (favoriteTeamGames.length === 1) {
        const favoriteTeamGame = favoriteTeamGames[0];
        setSelectedGameId(favoriteTeamGame.id);
        setSeatName(
          getSeasonTicketSeatName(profile, favoriteTeamGame, currentSeason),
        );
      }
    }
  }, [currentSeason, games, favoriteTeamName, profile, selectedGameId]);

  const displayedGames = [...games].sort((firstGame, secondGame) => {
    const isFirstFavoriteTeamGame =
      firstGame.awayTeamName === favoriteTeamName ||
      firstGame.homeTeamName === favoriteTeamName;
    const isSecondFavoriteTeamGame =
      secondGame.awayTeamName === favoriteTeamName ||
      secondGame.homeTeamName === favoriteTeamName;

    return Number(isSecondFavoriteTeamGame) - Number(isFirstFavoriteTeamGame);
  });

  const [originalTicketImage, setOriginalTicketImage] =
    useState<SelectedOriginalTicketImage | null>(null);

  const createTicketMutation = useCreateTicket();

  const canSaveTicket = selectedDate.length > 0 && selectedGameId !== null;
  const isSaveDisabled = !canSaveTicket || createTicketMutation.isPending;

  const handlePressDay = (day: DateData) => {
    if (day.dateString > today) {
      return;
    }

    setSelectedDate(day.dateString);
    setIsCalendarOpen(false);

    setSelectedGameId(null);
    setSeatName('');
  };

  const handlePressDateSummary = () => {
    setIsCalendarOpen(true);
  };

  const handlePressGame = (gameId: string) => {
    if (selectedGameId !== gameId) {
      setSeatName(
        getSeasonTicketSeatName(
          profile,
          games.find(game => game.id === gameId),
          currentSeason,
        ),
      );
    }

    setSelectedGameId(gameId);
  };

  const handleAddTicket = async () => {
    if (!selectedGameId || createTicketMutation.isPending) {
      return;
    }

    try {
      await createTicketMutation.mutateAsync({
        gameKey: selectedGameId,
        seatName,
        originalPhotoBase64: originalTicketImage?.base64,
      });

      navigation.goBack();
    } catch (error) {
      console.error('티켓을 저장하지 못했습니다.', error);

      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : null;

      if (errorCode === '23505') {
        Alert.alert(
          '이미 등록한 경기예요',
          '같은 티켓북에는 동일한 경기를 한 번만 등록할 수 있어요.',
        );
      } else {
        Alert.alert('티켓을 추가하지 못했어요', '잠시 후 다시 시도해 주세요.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="티켓 추가" onPressBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.keyboardArea} behavior="padding">
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <ResponsiveContent
            style={[
              styles.horizontalContent,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <OriginalTicketImageField
              value={originalTicketImage}
              onChange={setOriginalTicketImage}
            />

            <AddTicketDateSection
              today={today}
              selectedDate={selectedDate}
              isCalendarOpen={isCalendarOpen}
              onPressDay={handlePressDay}
              onPressDateSummary={handlePressDateSummary}
            />

            {selectedDate && !isCalendarOpen && (
              <AddTicketGameSection
                games={displayedGames}
                isLoadingGames={isLoadingGames}
                gameLoadError={gameLoadError}
                selectedGameId={selectedGameId}
                onPressGame={handlePressGame}
              />
            )}

            {selectedDate && !isCalendarOpen && (
              <View style={styles.seatSection}>
                <View style={styles.seatSectionHeader}>
                  <AppText style={styles.sectionTitle}>좌석 정보</AppText>
                  <AppText style={styles.optionalLabel}>선택</AppText>
                </View>

                <View style={styles.seatInputCard}>
                  <TextInput
                    allowFontScaling={false}
                    maxLength={100}
                    value={seatName}
                    onChangeText={setSeatName}
                    style={styles.seatInput}
                    placeholder="예: 덕아웃상단석 9블럭 J열"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="done"
                    clearButtonMode="while-editing"
                    accessibilityLabel="좌석 정보"
                  />
                </View>
              </View>
            )}
          </ResponsiveContent>
        </ScrollView>

        <View style={styles.footer}>
          <ResponsiveContent
            style={[
              styles.footerContent,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <AppButton
              disabled={isSaveDisabled}
              onPress={handleAddTicket}
              style={({ pressed }) => [
                styles.saveButton,
                isSaveDisabled && styles.saveButtonDisabled,
                pressed && !isSaveDisabled && styles.saveButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{
                disabled: isSaveDisabled,
                busy: createTicketMutation.isPending,
              }}
            >
              {createTicketMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <AppText
                  style={[
                    styles.saveButtonText,
                    isSaveDisabled && styles.saveButtonTextDisabled,
                  ]}
                >
                  티켓 추가
                </AppText>
              )}
            </AppButton>
          </ResponsiveContent>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AddTicketScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  horizontalContent: {
    paddingHorizontal: 12,
  },
  seatSection: {
    marginTop: 28,
  },
  seatSectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  optionalLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  seatInputCard: {
    minHeight: 58,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  seatInput: {
    minHeight: 46,
    padding: 0,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  footerContent: {
    paddingHorizontal: 12,
  },
  saveButton: {
    height: 54,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
  saveButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
