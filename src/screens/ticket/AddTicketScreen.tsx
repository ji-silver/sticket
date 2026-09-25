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
import AppButton from '../../components/common/AppButton.tsx';
import AppText from '../../components/common/AppText.tsx';
import { fonts } from '../../styles/fonts.ts';
import { useNavigation, useRoute } from '@react-navigation/core';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react-native';
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
import AppBottomSheet from '../../components/common/AppBottomSheet.tsx';
import AppSnackbar from '../../components/common/AppSnackbar.tsx';
import {
  ALL_SEAT_NAMES,
  getSeatNamesForGame,
} from '../../features/ticket/seatCatalog.ts';
import StadiumSeatNameList from './components/StadiumSeatNameList.tsx';
import { getSeasonTicketSeatName } from '../../features/ticket/seasonTicketSeat.ts';
import { recognizeTicketText } from '../../features/ticket/ticketOcr.service.ts';
import {
  findUniqueGameByTicketText,
  matchTicketSeat,
  parseTicketSeatDetail,
  parseTicketOcrText,
  type ParsedTicketOcr,
} from '../../features/ticket/ticketOcr.ts';

type AddTicketRouteProp = RouteProp<RootStackParamList, 'AddTicket'>;
type OcrStatus = 'idle' | 'reading' | 'partial' | 'failed';

const OCR_MESSAGES: Partial<Record<OcrStatus, string>> = {
  partial: '일부 항목은 직접 입력해 주세요',
  failed: '티켓 정보를 인식하지 못했어요',
};

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
  const [seatDetail, setSeatDetail] = useState('');
  const [isSeatNameSheetVisible, setIsSeatNameSheetVisible] = useState(false);
  const [originalTicketImage, setOriginalTicketImage] =
    useState<SelectedOriginalTicketImage | null>(null);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>('idle');
  const [parsedOcr, setParsedOcr] = useState<ParsedTicketOcr | null>(null);
  const seatDetailInputRef = useRef<TextInput>(null);
  const shouldFocusSeatDetail = useRef(false);
  const selectedDateRef = useRef(initialDate);
  const gameSelectedManually = useRef(false);
  const seatNameSource = useRef<'user' | 'ocr' | null>(null);
  const seatDetailSource = useRef<'user' | 'ocr' | null>(null);
  const ocrRequestId = useRef(0);
  const queryDate = !isCalendarOpen && selectedDate ? selectedDate : '';

  const {
    data: games = [],
    isLoading: isLoadingGames,
    isError,
  } = useGetGamesByDate(queryDate);
  const gameLoadError = isError ? '날짜를 다시 선택해 재시도해 주세요.' : null;

  useEffect(() => {
    if (parsedOcr) {
      if (isLoadingGames) {
        return;
      }

      const ocrGame = findUniqueGameByTicketText(
        games,
        parsedOcr.text,
        parsedOcr.stadiumId,
      );
      if (!ocrGame) {
        setOcrStatus('partial');
        return;
      }

      const matchedSeat = matchTicketSeat(
        parsedOcr.text,
        getSeatNamesForGame(ocrGame.stadiumName, ocrGame.homeTeamName),
      );

      setSelectedGameId(ocrGame.id);
      setSeatName(
        currentSeatName =>
          currentSeatName ||
          matchedSeat?.seatName ||
          getSeasonTicketSeatName(profile, ocrGame, currentSeason),
      );
      setSeatDetail(
        currentSeatDetail => currentSeatDetail || matchedSeat?.seatDetail || '',
      );
      setOcrStatus('idle');
      return;
    }

    if (selectedGameId) {
      return;
    }

    if (games.length > 0 && favoriteTeamName) {
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
        setSeatDetail('');
      }
    }
  }, [
    currentSeason,
    games,
    favoriteTeamName,
    isLoadingGames,
    parsedOcr,
    profile,
    selectedGameId,
  ]);

  useEffect(() => {
    if (!OCR_MESSAGES[ocrStatus]) {
      return;
    }

    const timeout = setTimeout(() => setOcrStatus('idle'), 4000);
    return () => clearTimeout(timeout);
  }, [ocrStatus]);

  const displayedGames = [...games].sort((firstGame, secondGame) => {
    const isFirstFavoriteTeamGame =
      firstGame.awayTeamName === favoriteTeamName ||
      firstGame.homeTeamName === favoriteTeamName;
    const isSecondFavoriteTeamGame =
      secondGame.awayTeamName === favoriteTeamName ||
      secondGame.homeTeamName === favoriteTeamName;

    return Number(isSecondFavoriteTeamGame) - Number(isFirstFavoriteTeamGame);
  });
  const selectedGame = games.find(game => game.id === selectedGameId);
  const stadiumSeatNames = getSeatNamesForGame(
    selectedGame?.stadiumName,
    selectedGame?.homeTeamName,
  );
  const canSelectSeatName = stadiumSeatNames.length > 0;

  const createTicketMutation = useCreateTicket();

  const canSaveTicket = selectedDate.length > 0 && selectedGameId !== null;
  const isSaveDisabled = !canSaveTicket || createTicketMutation.isPending;

  const handlePressDay = (day: DateData) => {
    if (day.dateString > today) {
      return;
    }

    ocrRequestId.current += 1;
    selectedDateRef.current = day.dateString;
    setSelectedDate(day.dateString);
    setIsCalendarOpen(false);
    setParsedOcr(null);
    setOcrStatus('idle');

    gameSelectedManually.current = false;
    setSelectedGameId(null);
    if (!originalTicketImage) {
      seatNameSource.current = null;
      seatDetailSource.current = null;
      setSeatName('');
      setSeatDetail('');
    }
  };

  const handlePressDateSummary = () => {
    setIsCalendarOpen(true);
  };

  const handlePressGame = (gameId: string) => {
    ocrRequestId.current += 1;
    setParsedOcr(null);
    setOcrStatus('idle');
    gameSelectedManually.current = true;

    if (selectedGameId !== gameId) {
      seatNameSource.current = null;
      seatDetailSource.current = null;
      setSeatName(
        getSeasonTicketSeatName(
          profile,
          games.find(game => game.id === gameId),
          currentSeason,
        ),
      );
      setSeatDetail('');
    }

    setSelectedGameId(gameId);
  };

  const handleOriginalTicketImageChange = (
    image: SelectedOriginalTicketImage | null,
  ) => {
    setOriginalTicketImage(image);
    setParsedOcr(null);

    if (seatNameSource.current === 'ocr') {
      seatNameSource.current = null;
      setSeatName('');
    }
    if (seatDetailSource.current === 'ocr') {
      seatDetailSource.current = null;
      setSeatDetail('');
    }

    const requestId = ++ocrRequestId.current;
    if (!image) {
      setOcrStatus('idle');
      return;
    }

    setOcrStatus('reading');

    (async () => {
      try {
        const text = await recognizeTicketText(image.uri);
        if (requestId !== ocrRequestId.current) {
          return;
        }

        if (!text.trim()) {
          setOcrStatus('failed');
          return;
        }

        const result = parseTicketOcrText(text, today);
        const matchedSeat = matchTicketSeat(result.text, ALL_SEAT_NAMES);
        const parsedSeatDetail = parseTicketSeatDetail(result.text);
        if (seatNameSource.current !== 'user') {
          seatNameSource.current = matchedSeat?.seatName ? 'ocr' : null;
          setSeatName(matchedSeat?.seatName || '');
        }
        if (seatDetailSource.current !== 'user') {
          const nextSeatDetail = matchedSeat?.seatDetail || parsedSeatDetail;
          seatDetailSource.current = nextSeatDetail ? 'ocr' : null;
          setSeatDetail(nextSeatDetail || '');
        }

        const currentDate = selectedDateRef.current;
        if (!result.date || (currentDate && currentDate !== result.date)) {
          setOcrStatus('partial');
          return;
        }

        if (!currentDate) {
          selectedDateRef.current = result.date;
          setSelectedDate(result.date);
          setIsCalendarOpen(false);
        }

        if (gameSelectedManually.current) {
          setOcrStatus('partial');
          return;
        }

        setParsedOcr(result);
        setOcrStatus('reading');
      } catch (error) {
        if (requestId !== ocrRequestId.current) {
          return;
        }

        console.error('티켓 정보를 읽지 못했습니다.', error);
        setOcrStatus('failed');
      }
    })();
  };

  const handleAddTicket = async () => {
    if (!selectedGameId || createTicketMutation.isPending) {
      return;
    }

    try {
      await createTicketMutation.mutateAsync({
        gameKey: selectedGameId,
        seatName,
        seatDetail,
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

  const closeSeatNameSheetAndFocusDetail = () => {
    shouldFocusSeatDetail.current = true;
    setIsSeatNameSheetVisible(false);
  };

  const handleSeatNameSheetClosed = () => {
    if (shouldFocusSeatDetail.current) {
      shouldFocusSeatDetail.current = false;
      seatDetailInputRef.current?.focus();
    }
  };

  const ocrMessage = OCR_MESSAGES[ocrStatus];

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
              onChange={handleOriginalTicketImageChange}
              isReading={ocrStatus === 'reading'}
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

                <View style={styles.seatFields}>
                  <View style={styles.seatInputFrame}>
                    <TextInput
                      allowFontScaling={false}
                      maxLength={100}
                      value={seatName}
                      onChangeText={value => {
                        seatNameSource.current = 'user';
                        setSeatName(value);
                      }}
                      style={styles.seatInput}
                      placeholder="좌석명 직접 입력"
                      placeholderTextColor={colors.textSecondary}
                      returnKeyType="next"
                      onSubmitEditing={() =>
                        seatDetailInputRef.current?.focus()
                      }
                      clearButtonMode="while-editing"
                      accessibilityLabel="좌석명"
                    />

                    {canSelectSeatName ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.seatNameSelectButton,
                          pressed && styles.seatNameSelectButtonPressed,
                        ]}
                        onPress={() => setIsSeatNameSheetVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel="좌석명 목록 열기"
                      >
                        <ChevronDown
                          size={20}
                          color={colors.textSecondary}
                          strokeWidth={2}
                        />
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={styles.seatInputFrame}>
                    <TextInput
                      ref={seatDetailInputRef}
                      allowFontScaling={false}
                      maxLength={100}
                      value={seatDetail}
                      onChangeText={value => {
                        seatDetailSource.current = 'user';
                        setSeatDetail(value);
                      }}
                      style={styles.seatInput}
                      placeholder="블록 열 좌석 번호 입력"
                      placeholderTextColor={colors.textSecondary}
                      returnKeyType="done"
                      clearButtonMode="while-editing"
                      accessibilityLabel="상세 위치"
                    />
                  </View>
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

      <AppBottomSheet
        visible={isSeatNameSheetVisible}
        title="좌석명 선택"
        onClose={() => setIsSeatNameSheetVisible(false)}
        onClosed={handleSeatNameSheetClosed}
        large
        closeAccessibilityLabel="좌석명 선택 닫기"
      >
        <StadiumSeatNameList
          seatNames={stadiumSeatNames}
          seatName={seatName}
          onSelect={selectedSeatName => {
            seatNameSource.current = 'user';
            setSeatName(selectedSeatName);
            closeSeatNameSheetAndFocusDetail();
          }}
        />
      </AppBottomSheet>

      {ocrMessage ? (
        <AppSnackbar
          message={ocrMessage}
          horizontalInset={20}
          bottomOffset={82}
        />
      ) : null}
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
  seatFields: {
    gap: 12,
  },
  seatInputFrame: {
    height: 52,
    paddingLeft: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatInput: {
    flex: 1,
    height: 50,
    paddingRight: 16,
    padding: 0,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  seatNameSelectButton: {
    width: 48,
    height: 50,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatNameSelectButtonPressed: {
    opacity: 0.55,
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
