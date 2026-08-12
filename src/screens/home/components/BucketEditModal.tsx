import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';
import { Bucket } from '../types.ts';
import AppButton from '../../../components/common/AppButton.tsx';
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

interface BucketEditModalProps {
  visible: boolean;
  bucket: Bucket | null;
  onClose: () => void;
  onAddBucket: (title: string) => Promise<boolean>;
  onUpdateBucket: (id: string, title: string) => Promise<boolean>;
  onDeleteBucket: (id: string) => Promise<boolean>;
  pending: boolean;
}

function BucketEditModal({
  visible,
  bucket,
  onClose,
  onAddBucket,
  onUpdateBucket,
  onDeleteBucket,
  pending,
}: BucketEditModalProps) {
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditing = bucket !== null;
  const normalizedDraft = draft.trim();
  const isBusy = pending || isSaving || isDeleting;
  const canSave = normalizedDraft.length > 0 && !isBusy;

  useEffect(() => {
    if (visible) {
      setDraft(bucket?.title ?? '');
    }
  }, [bucket, visible]);

  const handleSave = async () => {
    if (normalizedDraft.length === 0) {
      Alert.alert('내용을 입력해 주세요');
      return;
    }

    if (isBusy) return;

    if (bucket?.title === normalizedDraft) {
      onClose();
      return;
    }

    setIsSaving(true);

    try {
      const didSave = bucket
        ? await onUpdateBucket(bucket.id, normalizedDraft)
        : await onAddBucket(normalizedDraft);

      if (didSave) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bucket || isBusy) return;

    setIsDeleting(true);

    try {
      const didDelete = await onDeleteBucket(bucket.id);

      if (didDelete) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppBottomSheet
      visible={visible}
      title={isEditing ? '목표 수정' : '새 목표'}
      onClose={onClose}
      keyboardAvoiding
      closeAccessibilityLabel="버킷리스트 편집 닫기"
    >
      <TextInput
        value={draft}
        onChangeText={setDraft}
        style={styles.input}
        placeholder="직관 목표 입력"
        placeholderTextColor={colors.textPlaceholder}
        selectionColor={colors.primary}
        maxLength={50}
        returnKeyType="done"
        onSubmitEditing={handleSave}
        editable={!isBusy}
        autoFocus
        accessibilityLabel={
          isEditing ? '버킷리스트 내용' : '새 버킷리스트 목표'
        }
      />

      <AppButton
        style={({ pressed }) => [
          styles.saveButton,
          !canSave && styles.buttonDisabled,
          pressed && canSave && styles.buttonPressed,
        ]}
        onPress={handleSave}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityLabel={isEditing ? '버킷리스트 저장' : '버킷리스트 추가'}
        accessibilityState={{ disabled: !canSave, busy: isSaving }}
      >
        <AppText style={styles.saveButtonText}>
          {isSaving
            ? isEditing
              ? '저장 중'
              : '추가 중'
            : isEditing
            ? '저장'
            : '추가'}
        </AppText>
      </AppButton>

      {isEditing ? (
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && !isBusy && styles.buttonPressed,
          ]}
          onPress={handleDelete}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel={`${bucket.title} 삭제`}
          accessibilityState={{ disabled: isBusy, busy: isDeleting }}
        >
          <AppText style={styles.deleteButtonText}>
            {isDeleting ? '삭제 중' : '삭제하기'}
          </AppText>
        </Pressable>
      ) : null}
    </AppBottomSheet>
  );
}

export default BucketEditModal;

const styles = StyleSheet.create({
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  saveButton: {
    height: 52,
    marginTop: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
  deleteButton: {
    height: 48,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.error,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.55,
  },
});
