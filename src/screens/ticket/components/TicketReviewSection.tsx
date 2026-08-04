import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import AppText from '../../../components/common/AppText.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import {
  updateTicketFoods,
  updateTicketMemo,
  updateTicketRating,
} from '../../../features/ticket/ticket.service.ts';
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
  const [isRecordLimitExceeded, setIsRecordLimitExceeded] = useState(false);
  const previousRecordDraft = useRef(initialMemo ?? '');
  const [foods, setFoods] = useState(() => [...initialFoods]);
  const [foodDraft, setFoodDraft] = useState('');
  const [isEditingFoods, setIsEditingFoods] = useState(false);

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
        ticketId,
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
      const savedMemo = await updateTicketMemo(ticketId, recordDraft);

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
      const savedFoods = await updateTicketFoods(ticketId, nextFoods);

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
      const savedFoods = await updateTicketFoods(ticketId, nextFoods);
      setFoods(savedFoods);
    } catch (error) {
      console.error('야구 푸드를 삭제하지 못했습니다.', error);
      Alert.alert(
        '야구 푸드를 삭제하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  return (
    <View style={styles.area}>
      <View style={styles.card}>
        <View style={styles.ratingBlock}>
          <View style={styles.blockHeader}>
            <AppText style={styles.blockTitle}>오늘 경기는 어땠나요?</AppText>
          </View>

          <TicketStarRating value={rating} onChange={handleChangeRating} />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.recordBlock}>
          <View style={styles.blockHeader}>
            <AppText style={styles.blockTitle}>오늘의 기록</AppText>

            <InlineActionButton
              label={isEditingRecord ? '완료' : record ? '수정' : '기록하기'}
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
                style={[styles.recordText, !record && styles.placeholderText]}
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
                  color={canAddFood ? colors.onPrimary : colors.textSecondary}
                  strokeWidth={2.6}
                />
              </Pressable>
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
