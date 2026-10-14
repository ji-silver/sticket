import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import AppButton from '../../../components/common/AppButton.tsx';
import AppText from '../../../components/common/AppText.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { useUpdateTicketFoods } from '../../../features/ticket/api/useUpdateTicketFoods.ts';
import { useUpdateTicketMemo } from '../../../features/ticket/api/useUpdateTicketMemo.ts';
import { useUpdateTicketRating } from '../../../features/ticket/api/useUpdateTicketRating.ts';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import TicketStarRating from './TicketStarRating.tsx';

interface TicketReviewSectionProps {
  ticketId: string;
  initialRating: number | null;
  initialMemo: string | null;
  initialFoods: string[];
}

const recordInputHeight = 111;
const recordMaxLength = 300;

function TicketReviewSection({
  ticketId,
  initialRating,
  initialMemo,
  initialFoods,
}: TicketReviewSectionProps) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [record, setRecord] = useState(initialMemo ?? '');
  const [recordDraft, setRecordDraft] = useState(initialMemo ?? '');
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [isRecordExpanded, setIsRecordExpanded] = useState(false);
  const [recordLineCount, setRecordLineCount] = useState(0);
  const isSavingRecord = useRef(false);
  const [foods, setFoods] = useState(() => [...initialFoods]);
  const [foodDraft, setFoodDraft] = useState('');
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isEditingFoods, setIsEditingFoods] = useState(false);

  const trimmedFoodDraft = foodDraft.trim();
  const canAddFood =
    foods.length < 10 &&
    trimmedFoodDraft.length > 0 &&
    !foods.includes(trimmedFoodDraft);

  const updateRatingMutation = useUpdateTicketRating();
  const updateMemoMutation = useUpdateTicketMemo();
  const updateFoodsMutation = useUpdateTicketFoods();

  const handleChangeRating = async (nextRating: number) => {
    const previousRating = rating;

    setRating(nextRating);

    try {
      await updateRatingMutation.mutateAsync({
        ticketId,
        rating: nextRating === 0 ? null : nextRating,
      } as any);
    } catch (error) {
      console.error('별점을 저장하지 못했습니다.', error);
      setRating(previousRating);
      Alert.alert('별점을 저장하지 못했어요', '잠시 후 다시 시도해 주세요');
    }
  };

  const handleStartEditingRecord = () => {
    setRecordDraft(record);
    setIsEditingRecord(true);
  };

  const handleCancelEditingRecord = () => {
    if (isSavingRecord.current) return;

    setRecordDraft(record);
    setIsEditingRecord(false);
  };

  const handleSaveRecord = async () => {
    // React Query의 저장 상태가 화면에 반영되기 전 연속 탭도 중복 요청으로 보내지 않는다.
    if (isSavingRecord.current) return;

    isSavingRecord.current = true;

    try {
      const savedMemo = await updateMemoMutation.mutateAsync({
        ticketId,
        memo: recordDraft,
      });

      // 서버가 앞뒤 공백을 정리하거나 빈 메모를 null로 저장한 결과를 그대로 표시한다.
      setRecord(savedMemo ?? '');
      setIsRecordExpanded(false);
      setRecordLineCount(0);
      setIsEditingRecord(false);
    } catch (error) {
      console.error('메모를 저장하지 못했습니다.', error);
      Alert.alert('기록을 저장하지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      isSavingRecord.current = false;
    }
  };

  const handleToggleFoodEditor = () => {
    setFoodDraft('');
    setIsAddingFood(false);
    setIsEditingFoods(current => !current);
  };

  const handleStartAddingFood = () => {
    setFoodDraft('');
    setIsAddingFood(true);
    setIsEditingFoods(false);
  };

  const handleAddFood = async () => {
    if (!canAddFood) return;

    const nextFoods = [...foods, trimmedFoodDraft];

    try {
      await updateFoodsMutation.mutateAsync({ ticketId, foods: nextFoods });

      setFoods(nextFoods);
      setFoodDraft('');
      setIsAddingFood(false);
    } catch (error) {
      console.error('직관 푸드를 저장하지 못했습니다.', error);
      Alert.alert(
        '직관 푸드를 저장하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const handleRemoveFood = async (foodToRemove: string) => {
    const nextFoods = foods.filter(food => food !== foodToRemove);

    try {
      await updateFoodsMutation.mutateAsync({ ticketId, foods: nextFoods });
      setFoods(nextFoods);
    } catch (error) {
      console.error('직관 푸드를 삭제하지 못했습니다.', error);
      Alert.alert(
        '직관 푸드를 삭제하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  return (
    <View style={styles.area}>
      <View style={styles.card}>
        <View style={styles.ratingBlock}>
          <View style={styles.blockHeader}>
            <AppText style={styles.blockTitle}>경기 평가</AppText>
          </View>

          <TicketStarRating value={rating} onChange={handleChangeRating} />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.recordBlock}>
          <View style={styles.blockHeader}>
            <AppText style={styles.blockTitle}>오늘의 기록</AppText>

            {isEditingRecord ? (
              <View style={styles.recordActions}>
                <AppButton
                  style={({ pressed }) => [
                    styles.recordActionButton,
                    (pressed || updateMemoMutation.isPending) &&
                      styles.recordActionMuted,
                  ]}
                  disabled={updateMemoMutation.isPending}
                  onPress={handleCancelEditingRecord}
                  accessibilityLabel="편집 취소"
                >
                  <AppText style={styles.recordCancelText}>취소</AppText>
                </AppButton>
                <AppButton
                  style={({ pressed }) => [
                    styles.recordActionButton,
                    pressed && styles.recordActionMuted,
                  ]}
                  isLoading={updateMemoMutation.isPending}
                  loadingColor={colors.primary}
                  onPress={handleSaveRecord}
                  accessibilityLabel="오늘의 기록 저장"
                >
                  <AppText style={styles.recordSaveText}>저장</AppText>
                </AppButton>
              </View>
            ) : (
              <InlineActionButton
                label={record ? '수정' : '작성하기'}
                tone="primary"
                onPress={handleStartEditingRecord}
                accessibilityLabel={
                  record ? '오늘의 기록 수정' : '오늘의 기록 작성하기'
                }
              />
            )}
          </View>

          {isEditingRecord ? (
            <View>
              <TextInput
                allowFontScaling={false}
                value={recordDraft}
                onChangeText={setRecordDraft}
                maxLength={recordMaxLength}
                style={styles.recordInput}
                placeholder="기록을 입력해 주세요"
                placeholderTextColor={colors.textSecondary}
                selectionColor={colors.primary}
                multiline
                scrollEnabled
                editable={!updateMemoMutation.isPending}
                autoFocus
                textAlignVertical="top"
                accessibilityLabel="오늘의 기록 입력"
              />

              <AppText style={styles.recordCharacterCount}>
                {recordDraft.length} / {recordMaxLength}
              </AppText>
            </View>
          ) : record ? (
            <View style={styles.recordContent}>
              <AppText
                style={styles.recordText}
                numberOfLines={isRecordExpanded ? undefined : 3}
              >
                {record}
              </AppText>

              {/* iOS의 3줄 미리보기는 잘린 뒤의 줄 수를 알려준다. 같은 너비로 전체 글을
                  별도 측정해 긴 메모에만 펼치기를 제공하며 입력 제한에는 사용하지 않는다. */}
              <View
                style={styles.recordLineMeasure}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <AppText
                  testID="record-line-measure"
                  style={styles.recordText}
                  onTextLayout={event =>
                    setRecordLineCount(event.nativeEvent.lines.length)
                  }
                >
                  {record}
                </AppText>
              </View>

              {recordLineCount > 3 ? (
                <View style={styles.recordExpandAction}>
                  <AppButton
                    style={({ pressed }) => [
                      styles.recordActionButton,
                      pressed && styles.recordActionMuted,
                    ]}
                    onPress={() => setIsRecordExpanded(current => !current)}
                    accessibilityLabel={
                      isRecordExpanded
                        ? '오늘의 기록 접기'
                        : '오늘의 기록 전체 보기'
                    }
                    accessibilityState={{ expanded: isRecordExpanded }}
                  >
                    <AppText style={styles.recordExpandText}>
                      {isRecordExpanded ? '접기' : '전체 보기'}
                    </AppText>
                  </AppButton>
                </View>
              ) : null}
            </View>
          ) : (
            <AppText style={styles.emptyRecordText}>아직 기록이 없어요</AppText>
          )}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.foodBlock}>
          <View style={styles.blockHeader}>
            <AppText style={styles.blockTitle}>직관 푸드</AppText>

            {isAddingFood || isEditingFoods || foods.length > 0 ? (
              <InlineActionButton
                label={isAddingFood ? '취소' : isEditingFoods ? '완료' : '편집'}
                tone="primary"
                onPress={
                  isAddingFood
                    ? () => setIsAddingFood(false)
                    : handleToggleFoodEditor
                }
                accessibilityLabel={
                  isAddingFood
                    ? '직관 푸드 추가 취소'
                    : isEditingFoods
                    ? '직관 푸드 편집 완료'
                    : '직관 푸드 편집'
                }
              />
            ) : null}
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
          ) : null}

          {!isAddingFood && !isEditingFoods ? (
            <Pressable
              style={({ pressed }) => [
                styles.foodAddChip,
                pressed && styles.foodAddChipPressed,
              ]}
              onPress={handleStartAddingFood}
              accessibilityRole="button"
              accessibilityLabel="직관 푸드 추가"
            >
              <Plus size={15} color={colors.primary} strokeWidth={2.5} />
              <AppText style={styles.foodAddChipText}>먹은 메뉴 추가</AppText>
            </Pressable>
          ) : null}

          {isAddingFood ? (
            <View style={styles.foodInputRow}>
              <TextInput
                allowFontScaling={false}
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
                accessibilityLabel="직관 푸드 이름"
              />

              <AppButton
                style={({ pressed }) => [
                  styles.foodAddButton,
                  !canAddFood && styles.foodAddButtonDisabled,
                  pressed && canAddFood && styles.foodAddButtonPressed,
                ]}
                onPress={handleAddFood}
                disabled={!canAddFood}
                accessibilityRole="button"
                accessibilityLabel="직관 푸드 추가"
                accessibilityState={{ disabled: !canAddFood }}
              >
                <Plus
                  size={19}
                  color={canAddFood ? colors.onPrimary : colors.textSecondary}
                  strokeWidth={2.6}
                />
              </AppButton>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default TicketReviewSection;

const styles = StyleSheet.create({
  area: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  card: {
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
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordActionButton: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordActionMuted: {
    opacity: 0.55,
  },
  recordCancelText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  recordSaveText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary,
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
  recordLineMeasure: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    opacity: 0,
  },
  recordExpandAction: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  recordExpandText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
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
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.text,
    overflow: 'hidden',
  },
  recordCharacterCount: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: fonts.regular,
    textAlign: 'right',
    color: colors.textSecondary,
  },
  emptyRecordText: {
    marginTop: 4,
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
  foodAddChip: {
    minHeight: 34,
    marginTop: 12,
    paddingHorizontal: 13,
    borderRadius: 17,
    borderCurve: 'continuous',
    backgroundColor: colors.primarySoft,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  foodAddChipPressed: {
    opacity: 0.6,
  },
  foodAddChipText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
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
