import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Diary } from '../types.ts';
import { fonts } from '../../../styles/fonts.ts';
import AppText from '../../../components/common/AppText.tsx';

interface DiaryActionSheetProps {
  visible: boolean;
  diary: Diary | null;
  onClose: () => void;
  onEditDiary: (diary: Diary) => void;
  onDeleteDiary: (diaryId: number) => void;
}

function DiaryActionSheet({
  visible,
  diary,
  onClose,
  onEditDiary,
  onDeleteDiary,
}: DiaryActionSheetProps) {
  if (!diary) return null;

  const cannotDelete = diary.recordCount > 0;

  const handlePressEdit = () => {
    onEditDiary(diary);
  };

  const handlePressDelete = () => {
    if (cannotDelete) return;

    onDeleteDiary(diary.id);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <AppText style={styles.title}>{diary.title} 티켓북</AppText>

          <AppText style={styles.description}>
            {cannotDelete
              ? '기록이 있는 티켓북은 삭제할 수 없어요.'
              : '티켓북을 수정하거나 삭제할 수 있어요.'}
          </AppText>

          <View style={styles.actionList}>
            <Pressable style={styles.actionRow} onPress={handlePressEdit}>
              <AppText style={styles.actionText}>수정하기</AppText>
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={styles.actionRow}
              onPress={handlePressDelete}
              disabled={cannotDelete}
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

            <Pressable style={styles.actionRow} onPress={onClose}>
              <AppText style={styles.cancelText}>취소</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default DiaryActionSheet;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFFFF',
  },

  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    marginBottom: 28,
    borderRadius: 3,
    backgroundColor: '#DADADA',
  },

  title: {
    fontSize: 22,
    fontFamily: fonts.black,
    fontWeight: '900',
    color: '#111111',
  },

  description: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    lineHeight: 20,
    color: '#8A8A8A',
  },

  actionList: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  actionRow: {
    height: 58,
    justifyContent: 'center',
  },

  actionText: {
    fontSize: 16,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: '#111111',
  },

  deleteText: {
    color: '#D92D20',
  },

  disabledText: {
    color: '#C9C9C9',
  },

  cancelText: {
    fontSize: 16,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: '#6F6F6F',
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
});
