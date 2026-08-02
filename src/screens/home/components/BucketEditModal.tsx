import {
  ActivityIndicator,
  Alert,
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
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { colors } from '../../../styles/colors.ts';

interface BucketEditModalProps {
  visible: boolean;
  buckets: Bucket[];
  title: string;
  onClose: () => void;
  onToggleBucket: (id: string) => Promise<boolean>;
  onAddBucket: (title: string) => Promise<boolean>;
  onUpdateBucket: (id: string, title: string) => Promise<boolean>;
  onDeleteBucket: (id: string) => Promise<boolean>;
  onRestoreBucket: (bucket: Bucket, index: number) => Promise<boolean>;
  pendingBucketIds: Set<string>;
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
  pendingBucketIds,
}: BucketEditModalProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const shouldScrollToEndRef = useRef(false);
  const committingTitleIdsRef = useRef(new Set<string>());
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastDeletedBucket, setLastDeletedBucket] = useState<{
    bucket: Bucket;
    index: number;
  } | null>(null);

  const trimTitle = newBucketTitle.trim();
  const canAddBucket = trimTitle.length > 0;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraftTitles(currentTitles => {
      const nextTitles: Record<string, string> = {};

      buckets.forEach(bucket => {
        nextTitles[bucket.id] = currentTitles[bucket.id] ?? bucket.title;
      });

      return nextTitles;
    });
  }, [buckets, visible]);

  useEffect(() => {
    if (lastDeletedBucket === null || isRestoring) return;

    const timeoutId = setTimeout(() => {
      setLastDeletedBucket(null);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [isRestoring, lastDeletedBucket]);

  const handleSubmitBucket = async () => {
    if (!canAddBucket || isAdding) return;

    setIsAdding(true);

    try {
      const didAdd = await onAddBucket(trimTitle);

      if (didAdd) {
        shouldScrollToEndRef.current = true;
        setNewBucketTitle('');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleClosed = () => {
    setNewBucketTitle('');
    setDraftTitles({});
    setLastDeletedBucket(null);
  };

  const handleCommitBucketTitle = async (bucket: Bucket) => {
    if (committingTitleIdsRef.current.has(bucket.id)) {
      return;
    }

    const nextTitle = (draftTitles[bucket.id] ?? bucket.title).trim();

    if (nextTitle.length === 0) {
      setDraftTitles(currentTitles => ({
        ...currentTitles,
        [bucket.id]: bucket.title,
      }));
      Alert.alert('내용을 입력해 주세요');
      return;
    }

    committingTitleIdsRef.current.add(bucket.id);

    try {
      const didUpdate = await onUpdateBucket(bucket.id, nextTitle);

      setDraftTitles(currentTitles => ({
        ...currentTitles,
        [bucket.id]: didUpdate ? nextTitle : bucket.title,
      }));
    } finally {
      committingTitleIdsRef.current.delete(bucket.id);
    }
  };

  const handleDeleteBucket = async (bucket: Bucket, index: number) => {
    const didDelete = await onDeleteBucket(bucket.id);

    if (didDelete) {
      setLastDeletedBucket({ bucket, index });
    }
  };

  const handleUndoDelete = async () => {
    if (lastDeletedBucket === null) return;

    setIsRestoring(true);

    try {
      const didRestore = await onRestoreBucket(
        lastDeletedBucket.bucket,
        lastDeletedBucket.index,
      );

      if (didRestore) {
        setLastDeletedBucket(null);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <AppBottomSheet
      visible={visible}
      title={title}
      description="목표를 추가하거나 내용을 바로 수정할 수 있어요"
      headerRight={
        <InlineActionButton label="닫기" tone="primary" onPress={onClose} />
      }
      large
      keyboardAvoiding
      onClose={onClose}
      onClosed={handleClosed}
      closeAccessibilityLabel="버킷리스트 편집 닫기"
    >
      <View style={styles.addInputRow}>
        <TextInput
          style={styles.addInput}
          value={newBucketTitle}
          onChangeText={setNewBucketTitle}
          placeholder="직관 목표 입력"
          placeholderTextColor={colors.textPlaceholder}
          returnKeyType="done"
          onSubmitEditing={() => {
            handleSubmitBucket();
          }}
          maxLength={50}
          accessibilityLabel="새 버킷리스트 목표"
        />

        <Pressable
          style={({ pressed }) => [
            styles.addSubmitButton,
            (!canAddBucket || isAdding) && styles.addSubmitButtonDisabled,
            pressed && canAddBucket && !isAdding && styles.buttonPressed,
          ]}
          onPress={() => {
            handleSubmitBucket();
          }}
          disabled={!canAddBucket || isAdding}
          accessibilityRole="button"
          accessibilityLabel="버킷리스트 추가"
          accessibilityState={{ disabled: !canAddBucket || isAdding }}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Plus
              size={20}
              color={canAddBucket ? colors.onPrimary : colors.textPlaceholder}
              strokeWidth={2.7}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.bucketScroll}
        contentContainerStyle={styles.bucketScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => {
          if (!shouldScrollToEndRef.current) return;

          shouldScrollToEndRef.current = false;
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
      >
        {buckets.map((bucket, index) => (
          <BucketEditRow
            key={bucket.id}
            bucket={bucket}
            isLast={index === buckets.length - 1}
            title={draftTitles[bucket.id] ?? bucket.title}
            disabled={pendingBucketIds.has(bucket.id)}
            onChangeTitle={text =>
              setDraftTitles(currentTitles => ({
                ...currentTitles,
                [bucket.id]: text,
              }))
            }
            onCommitTitle={() => {
              handleCommitBucketTitle(bucket);
            }}
            onToggle={() => {
              onToggleBucket(bucket.id);
            }}
            onDelete={() => {
              handleDeleteBucket(bucket, index);
            }}
          />
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
            onPress={() => {
              handleUndoDelete();
            }}
            disabled={isRestoring}
            accessibilityRole="button"
            accessibilityLabel="버킷리스트 삭제 실행 취소"
            accessibilityState={{ disabled: isRestoring }}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <AppText style={styles.undoButtonText}>실행 취소</AppText>
            )}
          </Pressable>
        </View>
      )}
    </AppBottomSheet>
  );
}

interface BucketEditRowProps {
  bucket: Bucket;
  isLast: boolean;
  title: string;
  disabled: boolean;
  onChangeTitle: (title: string) => void;
  onCommitTitle: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

function BucketEditRow({
  bucket,
  isLast,
  title,
  disabled,
  onChangeTitle,
  onCommitTitle,
  onToggle,
  onDelete,
}: BucketEditRowProps) {
  return (
    <View style={[styles.editRow, isLast && styles.editRowLast]}>
      <Pressable
        style={({ pressed }) => [
          styles.checkButton,
          pressed && !disabled && styles.buttonPressed,
        ]}
        onPress={onToggle}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityLabel={`${bucket.title} 완료`}
        accessibilityState={{ checked: bucket.isCompleted, disabled }}
      >
        <View
          style={[
            styles.editCheckBox,
            bucket.isCompleted && styles.checkBoxCompleted,
            disabled && styles.controlDisabled,
          ]}
        >
          {bucket.isCompleted && (
            <Check size={16} color={colors.onPrimary} strokeWidth={3} />
          )}
        </View>
      </Pressable>

      <TextInput
        value={title}
        onChangeText={onChangeTitle}
        onEndEditing={onCommitTitle}
        onSubmitEditing={onCommitTitle}
        editable={!disabled}
        maxLength={50}
        returnKeyType="done"
        placeholder="버킷리스트 입력"
        placeholderTextColor={colors.textPlaceholder}
        style={[styles.editInput, disabled && styles.controlDisabled]}
        accessibilityLabel="버킷리스트 내용"
      />

      <Pressable
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && !disabled && styles.buttonPressed,
          disabled && styles.controlDisabled,
        ]}
        onPress={onDelete}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${bucket.title} 삭제`}
        accessibilityState={{ disabled }}
      >
        <Trash2 size={17} color={colors.textPlaceholder} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

export default BucketEditModal;

const styles = StyleSheet.create({
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
  controlDisabled: {
    opacity: 0.5,
  },
  undoBar: {
    position: 'absolute',
    right: 0,
    left: 0,
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
