import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppSnackbar from '../../../components/common/AppSnackbar.tsx';
import AppText from '../../../components/common/AppText.tsx';
import ConfirmDialog from '../../../components/common/ConfirmDialog.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { Ticket } from '../types.ts';
import TicketLineupSection from './TicketLineupSection.tsx';
import TicketStarRating from './TicketStarRating.tsx';
import {
  deleteTicketOriginalPhoto,
  updateTicketFoods,
  updateTicketMemo,
  updateTicketOriginalPhoto,
  updateTicketRating,
} from '../../../features/ticket/ticket.service.ts';
import TicketSeatEditSheet from './TicketSeatEditSheet.tsx';
import {
  pickOriginalTicketImage,
  type OriginalTicketImageSource,
} from './OriginalTicketImageField.tsx';

interface TicketRecordPageProps {
  ticket: Ticket;
}

const recordInputHeight = 111;
const mockFavoriteTeamName = '키움';

type MatchResult = 'win' | 'lose' | 'draw';

const matchResultLabels: Record<MatchResult, string> = {
  win: '승리',
  lose: '패배',
  draw: '무승부',
};

const teamColors: Record<string, string> = {
  키움: '#570514',
  LG: '#C30452',
  한화: '#FC4E00',
  SSG: '#CE0E2D',
  삼성: '#074CA1',
  NC: '#315288',
  KT: '#000000',
  롯데: '#041E42',
  KIA: '#EA0029',
  두산: '#1A1748',
};

function TicketRecordPage({ ticket }: TicketRecordPageProps) {
  const { top, bottom } = useSafeAreaInsets();
  const matchDateText = formatMatchDate(ticket.matchDate);
  const awayScoreText = ticket.awayScore ?? '-';
  const homeScoreText = ticket.homeScore ?? '-';

  const matchResult = getFavoriteTeamMatchResult(ticket, mockFavoriteTeamName);
  const matchResultText = matchResult ? matchResultLabels[matchResult] : null;
  const matchResultBadgeStyle =
    matchResult === 'lose'
      ? styles.matchResultBadgeLose
      : matchResult === 'draw'
      ? styles.matchResultBadgeDraw
      : null;
  const matchResultTextStyle =
    matchResult === 'lose'
      ? styles.matchResultTextLose
      : matchResult === 'draw'
      ? styles.matchResultTextDraw
      : null;

  const [rating, setRating] = useState(ticket.rating ?? 0);
  const [record, setRecord] = useState(ticket.memo ?? '');
  const [recordDraft, setRecordDraft] = useState(ticket.memo ?? '');
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [isRecordLimitExceeded, setIsRecordLimitExceeded] = useState(false);
  const previousRecordDraft = useRef(ticket.memo ?? '');
  const [foods, setFoods] = useState(() => [...ticket.foods]);
  const [foodDraft, setFoodDraft] = useState('');
  const [isEditingFoods, setIsEditingFoods] = useState(false);
  const [isOriginalTicketVisible, setIsOriginalTicketVisible] = useState(false);
  const [originalTicketImageUri, setOriginalTicketImageUri] = useState(
    ticket.originalTicketImageUri,
  );
  const [
    isOriginalTicketEditSheetVisible,
    setIsOriginalTicketEditSheetVisible,
  ] = useState(false);
  const [
    isOriginalTicketSourceSheetVisible,
    setIsOriginalTicketSourceSheetVisible,
  ] = useState(false);
  const [
    isOriginalTicketDeleteDialogVisible,
    setIsOriginalTicketDeleteDialogVisible,
  ] = useState(false);
  const [isSavingOriginalTicket, setIsSavingOriginalTicket] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOriginalTicketEditAction = useRef<'change' | 'delete' | null>(
    null,
  );
  const shouldOpenOriginalTicketEditSheet = useRef(false);
  const pendingOriginalTicketImageSource =
    useRef<OriginalTicketImageSource | null>(null);
  const [seatName, setSeatName] = useState(ticket.seatName);
  const [isSeatSheetVisible, setIsSeatSheetVisible] = useState(false);

  useEffect(
    () => () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    },
    [],
  );

  const showToast = (message: string) => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }

    setToastMessage(message);
    toastTimeout.current = setTimeout(() => setToastMessage(null), 3000);
  };

  const trimmedFoodDraft = foodDraft.trim();
  const canAddFood =
    foods.length < 10 &&
    trimmedFoodDraft.length > 0 &&
    !foods.includes(trimmedFoodDraft);

  const handleChangeRating = async (nextRating: number) => {
    const previousRating = rating;

    setRating(nextRating);

    try {
      const savedRating = await updateTicketRating(
        ticket.id,
        nextRating === 0 ? null : nextRating,
      );

      setRating(savedRating ?? 0);
    } catch (error) {
      console.error('별점을 저장하지 못했습니다.', error);

      setRating(previousRating);

      Alert.alert('별점을 저장하지 못했어요', '잠시 후 다시 시도해 주세요');
    }
  };

  const handlePressRecordAction = async () => {
    if (!isEditingRecord) {
      previousRecordDraft.current = record;
      setRecordDraft(record);
      setIsRecordLimitExceeded(false);
      setIsEditingRecord(true);
      return;
    }

    try {
      const savedMemo = await updateTicketMemo(ticket.id, recordDraft);

      setRecord(savedMemo ?? '');
      setRecordDraft(savedMemo ?? '');
      setIsEditingRecord(false);
      setIsRecordLimitExceeded(false);
    } catch (error) {
      console.error('오늘의 기록을 저장하지 못했습니다.', error);

      Alert.alert(
        '오늘의 기록을 저장하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const handleChangeRecordDraft = (value: string) => {
    if (value.split('\n').length > 3) {
      setIsRecordLimitExceeded(true);
      return;
    }

    previousRecordDraft.current = recordDraft;
    setRecordDraft(value);
    setIsRecordLimitExceeded(false);
  };

  const handleToggleFoodEditor = () => {
    setFoodDraft('');
    setIsEditingFoods(current => !current);
  };

  const handleAddFood = async () => {
    if (!canAddFood) return;

    const nextFoods = [...foods, trimmedFoodDraft];

    try {
      const savedFoods = await updateTicketFoods(ticket.id, nextFoods);

      setFoods(savedFoods);
      setFoodDraft('');
    } catch (error) {
      console.error('야구 푸드를 저장하지 못했습니다.', error);

      Alert.alert(
        '야구 푸드를 저장하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const handleRemoveFood = async (foodToRemove: string) => {
    const nextFoods = foods.filter(food => food !== foodToRemove);

    try {
      const savedFoods = await updateTicketFoods(ticket.id, nextFoods);

      setFoods(savedFoods);
    } catch (error) {
      console.error('야구 푸드를 삭제하지 못했습니다.', error);

      Alert.alert(
        '야구 푸드를 삭제하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const handlePressOriginalTicket = () => {
    if (isSavingOriginalTicket) return;

    if (originalTicketImageUri) {
      setIsOriginalTicketVisible(true);
    } else {
      setIsOriginalTicketSourceSheetVisible(true);
    }
  };

  const requestOriginalTicketEdit = (action: 'change' | 'delete') => {
    pendingOriginalTicketEditAction.current = action;
    setIsOriginalTicketEditSheetVisible(false);
  };

  const handlePressOriginalTicketEdit = () => {
    if (isSavingOriginalTicket) return;

    shouldOpenOriginalTicketEditSheet.current = true;
    setIsOriginalTicketVisible(false);
  };

  const handleOriginalTicketViewerClosed = () => {
    if (!shouldOpenOriginalTicketEditSheet.current) return;

    shouldOpenOriginalTicketEditSheet.current = false;
    setIsOriginalTicketEditSheetVisible(true);
  };

  const handleOriginalTicketEditSheetClosed = () => {
    const action = pendingOriginalTicketEditAction.current;
    pendingOriginalTicketEditAction.current = null;

    if (action === 'change') {
      setIsOriginalTicketSourceSheetVisible(true);
    } else if (action === 'delete') {
      setIsOriginalTicketDeleteDialogVisible(true);
    }
  };

  const requestOriginalTicketImage = (source: OriginalTicketImageSource) => {
    pendingOriginalTicketImageSource.current = source;
    setIsOriginalTicketSourceSheetVisible(false);
  };

  const handleOriginalTicketSourceSheetClosed = async () => {
    const source = pendingOriginalTicketImageSource.current;
    pendingOriginalTicketImageSource.current = null;

    if (!source) return;

    const selectedImage = await pickOriginalTicketImage(source);

    if (!selectedImage) return;

    setIsSavingOriginalTicket(true);

    try {
      const signedUrl = await updateTicketOriginalPhoto(
        ticket.id,
        selectedImage.base64,
      );

      setOriginalTicketImageUri(signedUrl);
      showToast('원본 티켓 사진을 저장했어요');
    } catch (error) {
      console.error('원본 티켓 사진을 저장하지 못했습니다.', error);
      Alert.alert(
        '원본 티켓 사진을 저장하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSavingOriginalTicket(false);
    }
  };

  const handleDeleteOriginalTicket = async () => {
    if (isSavingOriginalTicket) return;

    setIsSavingOriginalTicket(true);

    try {
      await deleteTicketOriginalPhoto(ticket.id);

      setIsOriginalTicketDeleteDialogVisible(false);
      setIsOriginalTicketVisible(false);
      setOriginalTicketImageUri(undefined);
      showToast('원본 티켓 사진을 삭제했어요');
    } catch (error) {
      console.error('원본 티켓 사진을 삭제하지 못했습니다.', error);
      Alert.alert(
        '원본 티켓 사진을 삭제하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSavingOriginalTicket(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.matchSummary}>
          <AppText style={styles.matchMeta} numberOfLines={1}>
            {matchDateText} · {ticket.matchTime} · {ticket.stadiumName}
          </AppText>

          <View
            style={styles.scoreBoard}
            accessible
            accessibilityLabel={`원정 ${
              ticket.awayTeamName
            } ${awayScoreText} 대 홈 ${ticket.homeTeamName} ${homeScoreText}${
              matchResultText
                ? `, 응원 구단 ${mockFavoriteTeamName} 기준 ${matchResultText}`
                : ''
            }`}
          >
            <View style={styles.teamSide}>
              <AppText
                style={[
                  styles.teamRole,
                  {
                    color:
                      teamColors[ticket.awayTeamName] ?? colors.textSecondary,
                  },
                ]}
              >
                AWAY
              </AppText>

              <AppText style={styles.teamName} numberOfLines={1}>
                {ticket.awayTeamName}
              </AppText>
            </View>

            <View style={styles.scoreCenter}>
              <View style={styles.scoreRow}>
                <AppText style={styles.scoreText}>{awayScoreText}</AppText>
                <AppText style={styles.scoreDivider}>:</AppText>
                <AppText style={styles.scoreText}>{homeScoreText}</AppText>
              </View>
            </View>

            <View style={styles.teamSide}>
              <AppText
                style={[
                  styles.teamRole,
                  {
                    color:
                      teamColors[ticket.homeTeamName] ?? colors.textSecondary,
                  },
                ]}
              >
                HOME
              </AppText>

              <AppText style={styles.teamName} numberOfLines={1}>
                {ticket.homeTeamName}
              </AppText>
            </View>
          </View>

          {matchResultText ? (
            <View style={[styles.matchResultBadge, matchResultBadgeStyle]}>
              <AppText
                style={[styles.matchResultText, matchResultTextStyle]}
                numberOfLines={1}
              >
                {matchResultText}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.visitInfoArea}>
          <View style={[styles.detailCard, styles.visitInfoCard]}>
            <View style={styles.blockHeader}>
              <AppText style={styles.blockTitle}>좌석</AppText>

              <InlineActionButton
                label={seatName ? '수정' : '입력'}
                tone="primary"
                onPress={() => setIsSeatSheetVisible(true)}
                accessibilityLabel={
                  seatName
                    ? `좌석 정보 ${seatName}, 수정하기`
                    : '좌석 정보 입력하기'
                }
              />
            </View>

            <AppText
              style={[styles.seatValue, !seatName && styles.placeholderText]}
              numberOfLines={2}
            >
              {seatName ?? '좌석을 입력해 주세요'}
            </AppText>

            <View style={[styles.cardDivider, styles.visitInfoDivider]} />

            <View style={styles.blockHeader}>
              <AppText style={styles.blockTitle}>원본 티켓</AppText>

              <InlineActionButton
                label={originalTicketImageUri ? '보기' : '추가'}
                tone="primary"
                onPress={handlePressOriginalTicket}
                accessibilityLabel={
                  originalTicketImageUri
                    ? '원본 티켓 전체 보기'
                    : '원본 티켓 사진 추가'
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.recordArea}>
          <View style={styles.detailCard}>
            <View style={styles.ratingBlock}>
              <View style={styles.blockHeader}>
                <AppText style={styles.blockTitle}>
                  오늘 경기는 어땠나요?
                </AppText>
              </View>

              <TicketStarRating value={rating} onChange={handleChangeRating} />
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.recordBlock}>
              <View style={styles.blockHeader}>
                <AppText style={styles.blockTitle}>오늘의 기록</AppText>

                <InlineActionButton
                  label={
                    isEditingRecord ? '완료' : record ? '수정' : '기록하기'
                  }
                  tone="primary"
                  onPress={handlePressRecordAction}
                  accessibilityLabel={
                    isEditingRecord
                      ? '오늘의 기록 입력 완료'
                      : record
                      ? '오늘의 기록 수정'
                      : '오늘의 기록 작성하기'
                  }
                />
              </View>

              {isEditingRecord ? (
                <View>
                  <TextInput
                    value={recordDraft}
                    onChangeText={handleChangeRecordDraft}
                    maxLength={300}
                    style={styles.recordInput}
                    placeholder="오늘의 기록을 작성해주세요"
                    placeholderTextColor={colors.textSecondary}
                    selectionColor={colors.primary}
                    multiline
                    numberOfLines={3}
                    scrollEnabled={false}
                    autoFocus
                    textAlignVertical="top"
                    accessibilityLabel="오늘의 기록 입력"
                  />

                  <View
                    style={styles.recordMeasure}
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <AppText
                      style={styles.recordMeasureText}
                      onTextLayout={event => {
                        if (event.nativeEvent.lines.length > 3) {
                          setRecordDraft(previousRecordDraft.current);
                          setIsRecordLimitExceeded(true);
                        }
                      }}
                    >
                      {recordDraft || ' '}
                    </AppText>
                  </View>

                  {isRecordLimitExceeded ? (
                    <AppText
                      style={styles.recordLimitText}
                      accessibilityLiveRegion="polite"
                    >
                      최대 3줄까지 작성할 수 있어요
                    </AppText>
                  ) : null}
                </View>
              ) : (
                <View style={styles.recordContent}>
                  <AppText
                    style={[
                      styles.recordText,
                      !record && styles.placeholderText,
                    ]}
                    numberOfLines={3}
                  >
                    {record || '아직 기록하지 않았어요'}
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.foodBlock}>
              <View style={styles.blockHeader}>
                <AppText style={styles.blockTitle}>야구 푸드</AppText>

                <InlineActionButton
                  label={isEditingFoods ? '완료' : '추가'}
                  tone="primary"
                  onPress={handleToggleFoodEditor}
                  accessibilityLabel={
                    isEditingFoods ? '야구 푸드 편집 완료' : '야구 푸드 추가'
                  }
                />
              </View>

              {foods.length > 0 ? (
                <View style={styles.foodList}>
                  {foods.map(food => (
                    <View key={food} style={styles.foodChip}>
                      <AppText style={styles.foodChipText}>{food}</AppText>

                      {isEditingFoods ? (
                        <Pressable
                          style={styles.foodRemoveButton}
                          onPress={() => handleRemoveFood(food)}
                          hitSlop={6}
                          accessibilityRole="button"
                          accessibilityLabel={`${food} 삭제`}
                        >
                          <X
                            size={14}
                            color={colors.textSecondary}
                            strokeWidth={2.4}
                          />
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <AppText style={[styles.placeholderText, styles.foodEmptyText]}>
                  아직 기록한 야구장 푸드가 없어요
                </AppText>
              )}

              {isEditingFoods ? (
                <View style={styles.foodInputRow}>
                  <TextInput
                    value={foodDraft}
                    onChangeText={setFoodDraft}
                    style={styles.foodInput}
                    placeholder="음식 이름"
                    placeholderTextColor={colors.textSecondary}
                    selectionColor={colors.primary}
                    returnKeyType="done"
                    onSubmitEditing={handleAddFood}
                    autoFocus
                    maxLength={30}
                    accessibilityLabel="야구장 푸드 이름"
                  />

                  <Pressable
                    style={({ pressed }) => [
                      styles.foodAddButton,
                      !canAddFood && styles.foodAddButtonDisabled,
                      pressed && canAddFood && styles.foodAddButtonPressed,
                    ]}
                    onPress={handleAddFood}
                    disabled={!canAddFood}
                    accessibilityRole="button"
                    accessibilityLabel="야구장 푸드 추가"
                    accessibilityState={{ disabled: !canAddFood }}
                  >
                    <Plus
                      size={19}
                      color={
                        canAddFood ? colors.onPrimary : colors.textSecondary
                      }
                      strokeWidth={2.6}
                    />
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          <TicketLineupSection />
        </View>
      </ScrollView>

      <TicketSeatEditSheet
        visible={isSeatSheetVisible}
        ticketId={ticket.id}
        seatName={seatName}
        onSaved={setSeatName}
        onClose={() => setIsSeatSheetVisible(false)}
      />

      <AppBottomSheet
        visible={isOriginalTicketEditSheetVisible}
        title="원본 티켓 편집"
        onClose={() => setIsOriginalTicketEditSheetVisible(false)}
        onClosed={handleOriginalTicketEditSheetClosed}
        closeAccessibilityLabel="원본 티켓 편집 닫기"
      >
        <View style={styles.ticketActionList}>
          <TicketPhotoActionRow
            title="사진 변경"
            onPress={() => requestOriginalTicketEdit('change')}
          />

          <View style={styles.ticketActionDivider} />

          <TicketPhotoActionRow
            title="사진 삭제"
            tone="destructive"
            onPress={() => requestOriginalTicketEdit('delete')}
          />
        </View>
      </AppBottomSheet>

      <AppBottomSheet
        visible={isOriginalTicketSourceSheetVisible}
        title={originalTicketImageUri ? '티켓 사진 변경' : '티켓 사진 추가'}
        description="티켓 앞면이 잘 보이는 사진을 선택해 주세요"
        onClose={() => setIsOriginalTicketSourceSheetVisible(false)}
        onClosed={handleOriginalTicketSourceSheetClosed}
        closeAccessibilityLabel="티켓 사진 선택 닫기"
      >
        <View style={styles.ticketActionList}>
          <TicketPhotoActionRow
            title="사진 촬영"
            onPress={() => requestOriginalTicketImage('camera')}
          />

          <View style={styles.ticketActionDivider} />

          <TicketPhotoActionRow
            title="앨범에서 선택"
            onPress={() => requestOriginalTicketImage('library')}
          />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={isOriginalTicketDeleteDialogVisible}
        title="원본 티켓 사진을 삭제할까요?"
        description="삭제한 사진은 되돌릴 수 없어요."
        confirmLabel="삭제"
        confirmTone="destructive"
        isLoading={isSavingOriginalTicket}
        onConfirm={handleDeleteOriginalTicket}
        onCancel={() => setIsOriginalTicketDeleteDialogVisible(false)}
      />

      {originalTicketImageUri ? (
        <Modal
          visible={isOriginalTicketVisible}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsOriginalTicketVisible(false)}
          onDismiss={handleOriginalTicketViewerClosed}
        >
          <View
            style={[
              styles.originalTicketViewer,
              { paddingTop: top, paddingBottom: bottom },
            ]}
          >
            <StatusBar barStyle="dark-content" />

            <View style={styles.originalTicketViewerHeader}>
              <AppText style={styles.originalTicketViewerTitle}>
                원본 티켓
              </AppText>

              <Pressable
                style={({ pressed }) => [
                  styles.originalTicketCloseButton,
                  pressed && styles.originalTicketCloseButtonPressed,
                ]}
                onPress={() => setIsOriginalTicketVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="원본 티켓 닫기"
              >
                <X size={24} color={colors.text} strokeWidth={2.2} />
              </Pressable>

              <View style={styles.originalTicketEditButton}>
                <InlineActionButton
                  label="편집"
                  tone="primary"
                  onPress={handlePressOriginalTicketEdit}
                  accessibilityLabel="원본 티켓 사진 편집"
                />
              </View>
            </View>

            <Image
              source={{ uri: originalTicketImageUri }}
              style={styles.originalTicketImage}
              resizeMode="contain"
              accessibilityLabel="원본 티켓 이미지"
            />
          </View>
        </Modal>
      ) : null}

      {toastMessage ? (
        <AppSnackbar message={toastMessage} horizontalInset={24} />
      ) : null}
    </KeyboardAvoidingView>
  );
}

export default TicketRecordPage;

function formatMatchDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');

  return `${monthText}.${dayText} ${weekday}`;
}

function getFavoriteTeamMatchResult(
  ticket: Ticket,
  favoriteTeamName: string,
): MatchResult | null {
  if (ticket.awayScore === null || ticket.homeScore === null) {
    return null;
  }

  const isAwayTeam = ticket.awayTeamName === favoriteTeamName;
  const isHomeTeam = ticket.homeTeamName === favoriteTeamName;

  if (!isAwayTeam && !isHomeTeam) return null;
  if (ticket.awayScore === ticket.homeScore) return 'draw';

  const favoriteTeamScore = isAwayTeam ? ticket.awayScore : ticket.homeScore;
  const opponentScore = isAwayTeam ? ticket.homeScore : ticket.awayScore;

  return favoriteTeamScore > opponentScore ? 'win' : 'lose';
}

interface TicketPhotoActionRowProps {
  title: string;
  tone?: 'default' | 'destructive';
  onPress: () => void;
}

function TicketPhotoActionRow({
  title,
  tone = 'default',
  onPress,
}: TicketPhotoActionRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.ticketActionRow,
        pressed && styles.ticketActionRowPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <AppText
        style={[
          styles.ticketActionText,
          tone === 'destructive' && styles.ticketActionTextDestructive,
        ]}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  matchSummary: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  matchMeta: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scoreBoard: {
    minHeight: 56,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSide: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 4,
  },
  teamRole: {
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  teamName: {
    maxWidth: '100%',
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
  scoreCenter: {
    width: 104,
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    minWidth: 28,
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fonts.black,
    color: colors.text,
    textAlign: 'center',
  },
  scoreDivider: {
    marginHorizontal: 7,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.disabled,
  },
  matchResultBadge: {
    maxWidth: '100%',
    minHeight: 22,
    marginTop: 2,
    paddingHorizontal: 9,
    borderRadius: 11,
    borderCurve: 'continuous',
    backgroundColor: colors.primarySoft,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchResultText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  matchResultBadgeLose: {
    backgroundColor: '#FDECEC',
  },
  matchResultTextLose: {
    color: '#C44D4D',
  },
  matchResultBadgeDraw: {
    backgroundColor: '#F0F1F2',
  },
  matchResultTextDraw: {
    color: colors.textSecondary,
  },

  visitInfoArea: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  visitInfoCard: {
    paddingVertical: 12,
  },
  seatValue: {
    minHeight: 24,
    marginTop: 0,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  visitInfoDivider: {
    marginVertical: 12,
  },
  originalTicketViewer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  originalTicketViewerHeader: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originalTicketViewerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  originalTicketCloseButton: {
    position: 'absolute',
    left: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originalTicketCloseButtonPressed: {
    backgroundColor: colors.background,
  },
  originalTicketEditButton: {
    position: 'absolute',
    right: 10,
  },
  originalTicketImage: {
    flex: 1,
    width: '100%',
    marginVertical: 16,
  },
  ticketActionList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  ticketActionRow: {
    height: 58,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  ticketActionRowPressed: {
    backgroundColor: colors.background,
  },
  ticketActionText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  ticketActionTextDestructive: {
    color: '#D92D20',
  },
  ticketActionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  recordArea: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  detailCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
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
  ratingBlock: {
    minHeight: 88,
  },
  cardDivider: {
    height: 1,
    marginVertical: 20,
    backgroundColor: colors.border,
  },
  blockHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  recordBlock: {
    minHeight: 74,
  },
  recordContent: {
    minHeight: 82,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.background,
  },
  recordText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  recordInput: {
    height: recordInputHeight,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    fontSize: 15,
    lineHeight: 29,
    fontFamily: fonts.regular,
    color: colors.text,
    overflow: 'hidden',
  },
  recordMeasure: {
    position: 'absolute',
    top: 12,
    right: 15,
    left: 15,
    opacity: 0,
  },
  recordMeasureText: {
    fontSize: 15,
    lineHeight: 29,
    fontFamily: fonts.regular,
  },
  recordLimitText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.primary,
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  foodBlock: {
    minHeight: 72,
  },
  foodList: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foodEmptyText: {
    marginTop: 14,
  },
  foodChip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderCurve: 'continuous',
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foodChipText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  foodRemoveButton: {
    width: 20,
    height: 20,
    marginRight: -5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodInputRow: {
    height: 44,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  foodAddButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodAddButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  foodAddButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
});
