import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Plus, X } from 'lucide-react-native';
import AppText from '../../../components/common/AppText.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { Ticket } from '../types.ts';
import TicketLineupSection from './TicketLineupSection.tsx';
import TicketStarRating from './TicketStarRating.tsx';

interface TicketRecordPageProps {
  ticket: Ticket;
}

const initialRecord = '7회 말 역전 만루홈런';
const recordInputHeight = 111;
const initialFoods = ['크림새우', '닭강정', '떡볶이'];
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
  const matchDateText = formatMatchDate(ticket.matchDate);
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

  const [rating, setRating] = useState(0);
  const [record, setRecord] = useState(initialRecord);
  const [recordDraft, setRecordDraft] = useState(initialRecord);
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [isRecordLimitExceeded, setIsRecordLimitExceeded] = useState(false);
  const previousRecordDraft = useRef(initialRecord);
  const [foods, setFoods] = useState(initialFoods);
  const [foodDraft, setFoodDraft] = useState('');
  const [isEditingFoods, setIsEditingFoods] = useState(false);

  const trimmedFoodDraft = foodDraft.trim();
  const canAddFood =
    trimmedFoodDraft.length > 0 && !foods.includes(trimmedFoodDraft);

  const handlePressRecordAction = () => {
    if (isEditingRecord) {
      setRecord(recordDraft.trim());
      setIsEditingRecord(false);
      setIsRecordLimitExceeded(false);
      return;
    }

    previousRecordDraft.current = record;
    setRecordDraft(record);
    setIsRecordLimitExceeded(false);
    setIsEditingRecord(true);
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

  const handleAddFood = () => {
    if (!canAddFood) return;

    setFoods(currentFoods => [...currentFoods, trimmedFoodDraft]);
    setFoodDraft('');
  };

  const handleRemoveFood = (foodToRemove: string) => {
    setFoods(currentFoods =>
      currentFoods.filter(food => food !== foodToRemove),
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            accessibilityLabel={`원정 ${ticket.awayTeamName} ${
              ticket.awayScore
            } 대 홈 ${ticket.homeTeamName} ${ticket.homeScore}${
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
                <AppText style={styles.scoreText}>{ticket.awayScore}</AppText>
                <AppText style={styles.scoreDivider}>:</AppText>
                <AppText style={styles.scoreText}>{ticket.homeScore}</AppText>
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

        <View style={styles.recordArea}>
          <View style={styles.recordCard}>
            <View style={styles.ratingBlock}>
              <View style={styles.blockHeader}>
                <AppText style={styles.blockTitle}>
                  오늘 경기는 어땠나요?
                </AppText>
              </View>

              <TicketStarRating value={rating} onChange={setRating} />
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
                <AppText
                  style={[styles.placeholderText, styles.foodEmptyText]}
                >
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
  const isAwayTeam = ticket.awayTeamName === favoriteTeamName;
  const isHomeTeam = ticket.homeTeamName === favoriteTeamName;

  if (!isAwayTeam && !isHomeTeam) return null;
  if (ticket.awayScore === ticket.homeScore) return 'draw';

  const favoriteTeamScore = isAwayTeam ? ticket.awayScore : ticket.homeScore;
  const opponentScore = isAwayTeam ? ticket.homeScore : ticket.awayScore;

  return favoriteTeamScore > opponentScore ? 'win' : 'lose';
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
  recordArea: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  recordCard: {
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
