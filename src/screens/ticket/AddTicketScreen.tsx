import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../../components/common/AppText.tsx';
import { fonts } from '../../styles/fonts.ts';
import { useNavigation, useRoute } from '@react-navigation/core';
import { useEffect, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppCalendar from '../../components/common/AppCalendar.tsx';
import { DateData } from 'react-native-calendars';
import { colors } from '../../styles/colors.ts';
import InlineActionButton from '../../components/common/InlineActionButton.tsx';
import ScreenHeader from '../../components/common/ScreenHeader.tsx';
import ResponsiveContent from '../../components/common/ResponsiveContent.tsx';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import OriginalTicketImageField, {
  SelectedOriginalTicketImage,
} from './components/OriginalTicketImageField.tsx';
import { getGamesByDate, KboGame } from '../../features/game/game.service.ts';
import EmptyCard from '../../components/common/EmptyCard.tsx';
import { useAuth } from '../../features/auth/AuthProvider.tsx';
import { getTodayInKorea } from '../../lib/date.ts';
import type { RouteProp } from '@react-navigation/native';
import { useAddTicket } from '../../features/ticket/api/useAddTicket';

type AddTicketRouteProp = RouteProp<RootStackParamList, 'AddTicket'>;

function AddTicketScreen() {
  const horizontalPadding = 20;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AddTicketRouteProp>();
  const { profile } = useAuth();
  const favoriteTeamName = profile?.favorite_team?.short_name;

  const today = getTodayInKorea();
  const routeInitialDate = route.params?.initialDate;
  const initialDate =
    routeInitialDate && routeInitialDate <= today ? routeInitialDate : '';

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(!initialDate);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [games, setGames] = useState<KboGame[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [gameLoadError, setGameLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate || isCalendarOpen) {
      return;
    }

    let isCancelled = false;

    const loadGames = async () => {
      setGames([]);
      setSelectedGameId(null);
      setGameLoadError(null);
      setIsLoadingGames(true);

      try {
        const loadedGames = await getGamesByDate(selectedDate);

        if (!isCancelled) {
          setGames(loadedGames);

          const favoriteTeamGames = favoriteTeamName
            ? loadedGames.filter(
                game =>
                  game.awayTeamName === favoriteTeamName ||
                  game.homeTeamName === favoriteTeamName,
              )
            : [];

          if (favoriteTeamGames.length === 1) {
            setSelectedGameId(favoriteTeamGames[0].id);
          }
        }
      } catch (error) {
        console.error('경기 정보를 불러오지 못했습니다.', error);

        if (!isCancelled) {
          setGameLoadError('날짜를 다시 선택해 재시도해 주세요.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingGames(false);
        }
      }
    };

    loadGames();

    return () => {
      isCancelled = true;
    };
  }, [favoriteTeamName, isCalendarOpen, selectedDate]);

  const [seatName, setSeatName] = useState('');
  const [originalTicketImage, setOriginalTicketImage] =
    useState<SelectedOriginalTicketImage | null>(null);

  const { mutateAsync: addTicket, isPending: isSaving } = useAddTicket();

  const canSaveTicket = selectedDate.length > 0 && selectedGameId !== null;
  const isSaveDisabled = !canSaveTicket || isSaving;

  const selectedDateText = selectedDate ? formatDateText(selectedDate) : '';

  const markedDates = selectedDate
    ? {
        [selectedDate]: {
          selected: true,
          selectedColor: colors.primary,
          selectedTextColor: colors.onPrimary,
        },
      }
    : {};

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
      setSeatName('');
    }

    setSelectedGameId(gameId);
  };

  const handleAddTicket = async () => {
    if (!selectedGameId || isSaving) {
      return;
    }

    try {
      await addTicket({
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

            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>직관 날짜</AppText>
            </View>

            {selectedDate && (
              <View style={styles.dateSummaryCard}>
                <View style={styles.dateSummaryTextArea}>
                  <AppText style={styles.dateSummaryLabel}>선택한 날짜</AppText>
                  <AppText style={styles.dateSummaryText}>
                    {selectedDateText}
                  </AppText>
                </View>

                <InlineActionButton
                  label="변경"
                  tone="primary"
                  onPress={handlePressDateSummary}
                  accessibilityLabel="직관 날짜 다시 선택"
                />
              </View>
            )}

            {isCalendarOpen && (
              <AppCalendar
                current={selectedDate || undefined}
                maxDate={today}
                disableAllTouchEventsForDisabledDays
                markedDates={markedDates}
                onDayPress={handlePressDay}
              />
            )}

            {selectedDate && !isCalendarOpen && (
              <View style={styles.gameSection}>
                <View style={styles.gameSectionHeader}>
                  <AppText style={styles.sectionTitle}>
                    어떤 경기를 봤나요?
                  </AppText>
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
                          onPress={() => handlePressGame(game.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`${game.awayTeamName} 원정 대 ${game.homeTeamName} 홈, ${game.time}, ${game.stadiumName}`}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <View style={styles.matchupRow}>
                            <View style={styles.teamSide}>
                              <AppText style={styles.teamRole}>AWAY</AppText>
                              <AppText
                                style={styles.teamName}
                                numberOfLines={1}
                              >
                                {game.awayTeamName}
                              </AppText>
                            </View>

                            <AppText style={styles.vsText}>VS</AppText>

                            <View style={styles.teamSide}>
                              <AppText style={styles.teamRole}>HOME</AppText>
                              <AppText
                                style={styles.teamName}
                                numberOfLines={1}
                              >
                                {game.homeTeamName}
                              </AppText>
                            </View>
                          </View>

                          <View style={styles.gameMetaRow}>
                            <View style={styles.gameMetaContent}>
                              <AppText style={styles.gameTime}>
                                {game.time}
                              </AppText>

                              <View style={styles.metaDot} />

                              <AppText
                                style={styles.stadiumName}
                                numberOfLines={1}
                              >
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
            )}

            {selectedDate && !isCalendarOpen && (
              <View style={styles.seatSection}>
                <View style={styles.seatSectionHeader}>
                  <AppText style={styles.sectionTitle}>좌석 정보</AppText>
                  <AppText style={styles.optionalLabel}>선택</AppText>
                </View>

                <View style={styles.seatInputCard}>
                  <TextInput
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
            <Pressable
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
                busy: isSaving,
              }}
            >
              {isSaving ? (
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
            </Pressable>
          </ResponsiveContent>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AddTicketScreen;

const formatDateText = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

  return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
};

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
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  dateSummaryCard: {
    minHeight: 82,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSummaryTextArea: {
    flex: 1,
  },
  dateSummaryLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.secondary,
  },
  dateSummaryText: {
    marginTop: 6,
    fontSize: 18,
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

  seatSection: {
    marginTop: 28,
  },
  seatSectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  emptyCard: {
    minHeight: 156,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    borderRadius: 18,
    borderCurve: 'continuous',
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
