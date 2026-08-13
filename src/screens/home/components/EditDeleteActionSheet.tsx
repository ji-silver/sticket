import { Pressable, StyleSheet, View } from 'react-native';
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

interface EditDeleteActionSheetProps {
  visible: boolean;
  targetName: string;
  onClose: () => void;
  onClosed?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function EditDeleteActionSheet({
  visible,
  targetName,
  onClose,
  onClosed,
  onEdit,
  onDelete,
}: EditDeleteActionSheetProps) {
  return (
    <AppBottomSheet
      visible={visible}
      showCloseButton={false}
      onClose={onClose}
      onClosed={onClosed}
      closeAccessibilityLabel={`${targetName} 메뉴 닫기`}
    >
      <Pressable
        style={({ pressed }) => [
          styles.actionRow,
          pressed && styles.actionRowPressed,
        ]}
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`${targetName} 수정하기`}
      >
        <AppText style={styles.actionText}>수정하기</AppText>
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        style={({ pressed }) => [
          styles.actionRow,
          pressed && styles.actionRowPressed,
        ]}
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`${targetName} 삭제하기`}
      >
        <AppText style={[styles.actionText, styles.deleteText]}>
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
        accessibilityLabel={`${targetName} 메뉴 취소`}
      >
        <AppText style={[styles.actionText, styles.cancelText]}>취소</AppText>
      </Pressable>
    </AppBottomSheet>
  );
}

export default EditDeleteActionSheet;

const styles = StyleSheet.create({
  actionRow: {
    height: 56,
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
    color: colors.error,
  },
  cancelText: {
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
