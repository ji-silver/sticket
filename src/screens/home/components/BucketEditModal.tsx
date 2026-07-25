import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Check, Plus, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bucket } from '../types.ts';
import { useEffect, useRef, useState } from 'react';
import { fonts } from '../../../styles/fonts.ts';
import AppText from '../../../components/common/AppText.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { colors } from '../../../styles/colors.ts';

interface BucketEditModalProps {
  visible: boolean;
  buckets: Bucket[];
  title: string;
  onClose: () => void;
  onToggleBucket: (id: number) => void;
  onAddBucket: (title: string) => void;
  onUpdateBucket: (id: number, title: string) => void;
  onDeleteBucket: (id: number) => void;
  onRestoreBucket: (bucket: Bucket, index: number) => void;
}

function BucketEditModal({
  visible,
  buckets,
  title,
  onClose,
  onToggleBucket,
  onAddBucket,
  onUpdateBucket,
  onDeleteBucket,
  onRestoreBucket,
}: BucketEditModalProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const shouldScrollToEndRef = useRef(false);
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [lastDeletedBucket, setLastDeletedBucket] = useState<{
    bucket: Bucket;
    index: number;
  } | null>(null);

  const trimTitle = newBucketTitle.trim();
  const canAddBucket = trimTitle.length > 0;

  useEffect(() => {
    if (lastDeletedBucket === null) return;

    const timeoutId = setTimeout(() => {
      setLastDeletedBucket(null);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [lastDeletedBucket]);

  const handleSubmitBucket = () => {
    if (!canAddBucket) return;

    shouldScrollToEndRef.current = true;
    onAddBucket(trimTitle);
    setNewBucketTitle('');
  };

  const handleClose = () => {
    setNewBucketTitle('');
    setLastDeletedBucket(null);
    onClose();
  };

  const handleDeleteBucket = (bucket: Bucket, index: number) => {
    onDeleteBucket(bucket.id);
    setLastDeletedBucket({ bucket, index });
  };

  const handleUndoDelete = () => {
    if (lastDeletedBucket === null) return;

    onRestoreBucket(lastDeletedBucket.bucket, lastDeletedBucket.index);
    setLastDeletedBucket(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="버킷리스트 편집 닫기"
        />

        <View
          style={[
            styles.editSheet,
            { paddingBottom: Math.max(bottomInset, 12) },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderCopy}>
              <AppText style={styles.sheetTitle}>{title}</AppText>
              <AppText style={styles.sheetSubtitle}>
                목표를 추가하거나 내용을 바로 수정할 수 있어요
              </AppText>
            </View>

            <InlineActionButton
              label="닫기"
              tone="primary"
              onPress={handleClose}
            />
          </View>

          <View style={styles.addInputRow}>
            <TextInput
              style={styles.addInput}
              value={newBucketTitle}
              onChangeText={setNewBucketTitle}
              placeholder="직관 목표 입력"
              placeholderTextColor={colors.textPlaceholder}
              returnKeyType="done"
              onSubmitEditing={handleSubmitBucket}
              accessibilityLabel="새 버킷리스트 목표"
            />

            <Pressable
              style={({ pressed }) => [
                styles.addSubmitButton,
                !canAddBucket && styles.addSubmitButtonDisabled,
                pressed && canAddBucket && styles.buttonPressed,
              ]}
              onPress={handleSubmitBucket}
              disabled={!canAddBucket}
              accessibilityRole="button"
              accessibilityLabel="버킷리스트 추가"
              accessibilityState={{ disabled: !canAddBucket }}
            >
              <Plus
                size={20}
                color={canAddBucket ? colors.onPrimary : colors.textPlaceholder}
                strokeWidth={2.7}
              />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.bucketScroll}
            contentContainerStyle={styles.bucketScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            onContentSizeChange={() => {
              if (!shouldScrollToEndRef.current) return;

              shouldScrollToEndRef.current = false;
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {buckets.map((bucket, index) => (
              <View
                key={String(bucket.id)}
                style={[
                  styles.editRow,
                  index === buckets.length - 1 && styles.editRowLast,
                ]}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.checkButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => onToggleBucket(bucket.id)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${bucket.title} 완료`}
                  accessibilityState={{ checked: bucket.isCompleted }}
                >
                  <View
                    style={[
                      styles.editCheckBox,
                      bucket.isCompleted && styles.checkBoxCompleted,
                    ]}
                  >
                    {bucket.isCompleted && (
                      <Check
                        size={16}
                        color={colors.onPrimary}
                        strokeWidth={3}
                      />
                    )}
                  </View>
                </Pressable>

                <TextInput
                  value={bucket.title}
                  onChangeText={text => onUpdateBucket(bucket.id, text)}
                  placeholder="버킷리스트 입력"
                  placeholderTextColor={colors.textPlaceholder}
                  style={styles.editInput}
                  accessibilityLabel="버킷리스트 내용"
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => handleDeleteBucket(bucket, index)}
                  accessibilityRole="button"
                  accessibilityLabel={`${bucket.title} 삭제`}
                >
                  <Trash2
                    size={17}
                    color={colors.textPlaceholder}
                    strokeWidth={2.2}
                  />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          {lastDeletedBucket !== null && (
            <View
              style={[styles.undoBar, { bottom: Math.max(bottomInset, 12) }]}
              accessibilityRole="alert"
            >
              <AppText style={styles.undoMessage} numberOfLines={1}>
                버킷리스트를 삭제했어요
              </AppText>

              <Pressable
                style={({ pressed }) => [
                  styles.undoButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleUndoDelete}
                accessibilityRole="button"
                accessibilityLabel="버킷리스트 삭제 실행 취소"
              >
                <AppText style={styles.undoButtonText}>실행 취소</AppText>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default BucketEditModal;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  editSheet: {
    height: '78%',
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },
  sheetHeader: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetHeaderCopy: {
    flex: 1,
    paddingRight: 8,
  },
  sheetTitle: {
    fontSize: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  addInputRow: {
    height: 48,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    fontSize: 16,
    fontFamily: fonts.regular,
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: colors.text,
  },
  addSubmitButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSubmitButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  bucketScroll: { flex: 1 },
  bucketScrollContent: {
    paddingBottom: 64,
  },
  editRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  editRowLast: {
    borderBottomWidth: 0,
  },
  checkButton: {
    width: 44,
    height: 44,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCheckBox: {
    width: 20,
    height: 20,
    borderRadius: 7,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: colors.disabled,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  editInput: {
    flex: 1,
    height: 42,
    padding: 0,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  deleteButton: {
    width: 44,
    height: 44,
    marginLeft: 4,
    marginRight: -8,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.55,
  },
  undoBar: {
    position: 'absolute',
    right: 24,
    left: 24,
    minHeight: 48,
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  undoMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.onPrimary,
  },
  undoButton: {
    minWidth: 76,
    minHeight: 44,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
