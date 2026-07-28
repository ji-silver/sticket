import { Pressable, StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { Diary } from '../types.ts';
import { fonts } from '../../../styles/fonts.ts';
import { colors } from '../../../styles/colors.ts';
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';

interface DiaryActionSheetProps {
  visible: boolean;
  diary: Diary | null;
  onClose: () => void;
  onEditDiary: (diary: Diary) => void;
  onDeleteDiary: (diaryId: string) => void;
}

function DiaryActionSheet({
  visible,
  diary,
  onClose,
  onEditDiary,
  onDeleteDiary,
}: DiaryActionSheetProps) {
  const displayedDiaryRef = useRef<Diary | null>(diary);

  if (diary !== null) {
    displayedDiaryRef.current = diary;
  }

  const displayedDiary = diary ?? displayedDiaryRef.current;

  if (displayedDiary === null) {
    return null;
  }

  const cannotDelete = displayedDiary.recordCount > 0;

  const handlePressEdit = () => {
    onEditDiary(displayedDiary);
  };

  const handlePressDelete = () => {
    if (cannotDelete) return;

    onDeleteDiary(displayedDiary.id);
  };

  return (
    <AppBottomSheet
      visible={visible}
      title={`${displayedDiary.title} 티켓북`}
      description={
        cannotDelete
          ? '기록이 있는 티켓북은 삭제할 수 없어요.'
          : '티켓북을 수정하거나 삭제할 수 있어요.'
      }
      showCloseButton={false}
      onClose={onClose}
      closeAccessibilityLabel="티켓북 메뉴 닫기"
    >
      <View style={styles.actionList}>
        <Pressable
          style={({ pressed }) => [
            styles.actionRow,
            pressed && styles.actionRowPressed,
          ]}
          onPress={handlePressEdit}
          accessibilityRole="button"
        >
          <AppText style={styles.actionText}>수정하기</AppText>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [
            styles.actionRow,
            pressed && !cannotDelete && styles.actionRowPressed,
          ]}
          onPress={handlePressDelete}
          disabled={cannotDelete}
          accessibilityRole="button"
          accessibilityState={{ disabled: cannotDelete }}
        >
          <AppText
            style={[
              styles.actionText,
              styles.deleteText,
              cannotDelete && styles.disabledText,
            ]}
          >
            삭제하기
          </AppText>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [
            styles.actionRow,
            pressed && styles.actionRowPressed,
          ]}
          onPress={onClose}
          accessibilityRole="button"
        >
          <AppText style={styles.cancelText}>취소</AppText>
        </Pressable>
      </View>
    </AppBottomSheet>
  );
}

export default DiaryActionSheet;

const styles = StyleSheet.create({
  actionList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionRow: {
    height: 58,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  actionRowPressed: {
    backgroundColor: colors.background,
  },
  actionText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  deleteText: {
    color: '#D92D20',
  },
  disabledText: {
    color: colors.disabled,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
