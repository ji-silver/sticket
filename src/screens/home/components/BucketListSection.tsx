import { Pressable, StyleSheet, View } from 'react-native';
import { Bucket } from '../types.ts';
import { Check, ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import BucketEditModal from './BucketEditModal.tsx';
import { fonts } from '../../../styles/fonts.ts';
import AppText from '../../../components/common/AppText.tsx';
import AppSnackbar from '../../../components/common/AppSnackbar.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { colors } from '../../../styles/colors.ts';

interface BucketListSectionProps {
  diaryId: string;
  diaryTitle: string;
  buckets: Bucket[];
  onAddBucket: (ticketBookId: string, title: string) => Promise<boolean>;
  onToggleBucket: (bucket: Bucket) => Promise<boolean>;
  onUpdateBucketTitle: (bucket: Bucket, title: string) => Promise<boolean>;
  onDeleteBucket: (bucket: Bucket) => Promise<boolean>;
  onRestoreBucket: (bucket: Bucket, index: number) => Promise<boolean>;
}

function BucketListSection({
  diaryId,
  diaryTitle,
  buckets,
  onAddBucket,
  onToggleBucket,
  onUpdateBucketTitle,
  onDeleteBucket,
  onRestoreBucket,
}: BucketListSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [pendingBucketIds, setPendingBucketIds] = useState<Set<string>>(
    new Set(),
  );
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastDeletedBucket, setLastDeletedBucket] = useState<{
    bucket: Bucket;
    index: number;
  } | null>(null);

  const visibleBuckets = isExpanded ? buckets : buckets.slice(0, 5);
  const canToggle = buckets.length > 5;
  const isBucketEmpty = buckets.length === 0;

  useEffect(() => {
    setIsExpanded(false);
    setIsEditorVisible(false);
    setEditingBucket(null);
    setPendingBucketIds(new Set());
    setLastDeletedBucket(null);
  }, [diaryId]);

  useEffect(() => {
    if (lastDeletedBucket === null || isRestoring) return;

    const timeoutId = setTimeout(() => setLastDeletedBucket(null), 3000);

    return () => clearTimeout(timeoutId);
  }, [isRestoring, lastDeletedBucket]);

  const runBucketMutation = async (
    bucketId: string,
    mutation: () => Promise<boolean>,
  ) => {
    if (pendingBucketIds.has(bucketId)) {
      return false;
    }

    setPendingBucketIds(currentIds => new Set(currentIds).add(bucketId));

    try {
      return await mutation();
    } finally {
      setPendingBucketIds(currentIds => {
        const nextIds = new Set(currentIds);
        nextIds.delete(bucketId);
        return nextIds;
      });
    }
  };

  const findBucket = (id: string) =>
    buckets.find(bucket => bucket.id === id) ?? null;

  const handleToggleBucket = async (id: string) => {
    const bucket = findBucket(id);

    if (!bucket) {
      return false;
    }

    return runBucketMutation(id, () => onToggleBucket(bucket));
  };

  const handleAddBucket = (title: string) => {
    return onAddBucket(diaryId, title);
  };

  const handleUpdateBucket = async (id: string, title: string) => {
    const bucket = findBucket(id);

    if (!bucket) {
      return false;
    }

    return runBucketMutation(id, () => onUpdateBucketTitle(bucket, title));
  };

  const handleDeleteBucket = async (id: string) => {
    const bucket = findBucket(id);
    const index = buckets.findIndex(item => item.id === id);

    if (!bucket || index < 0) {
      return false;
    }

    const didDelete = await runBucketMutation(id, () => onDeleteBucket(bucket));

    if (didDelete) {
      setLastDeletedBucket({ bucket, index });
    }

    return didDelete;
  };

  const handleRestoreBucket = (bucket: Bucket, index: number) => {
    return runBucketMutation(bucket.id, () => onRestoreBucket(bucket, index));
  };

  const handleUndoDelete = async () => {
    if (lastDeletedBucket === null) return;

    setIsRestoring(true);

    try {
      const didRestore = await handleRestoreBucket(
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

  const openAddBucket = () => {
    setEditingBucket(null);
    setIsEditorVisible(true);
  };

  const openEditBucket = (bucket: Bucket) => {
    setEditingBucket(bucket);
    setIsEditorVisible(true);
  };

  return (
    <View style={styles.bucketSection}>
      <View style={styles.bucketHeader}>
        <View>
          <AppText style={styles.bucketTitle}>
            {diaryTitle} 직관 버킷리스트
          </AppText>
        </View>

        <InlineActionButton
          label="추가"
          tone="primary"
          icon={<Plus size={16} color={colors.primary} strokeWidth={2.5} />}
          onPress={openAddBucket}
        />
      </View>

      <View style={styles.bucketCard}>
        {isBucketEmpty ? (
          <Pressable
            style={({ pressed }) => [
              styles.emptyBucketBox,
              pressed && styles.buttonPressed,
            ]}
            onPress={openAddBucket}
            accessibilityRole="button"
            accessibilityLabel="첫 직관 목표 추가"
          >
            <View style={styles.emptyIcon}>
              <Plus size={18} color={colors.primary} strokeWidth={2.5} />
            </View>
            <AppText style={styles.emptyBucketTitle}>
              첫 직관 목표를 추가해보세요
            </AppText>
          </Pressable>
        ) : (
          <>
            {visibleBuckets.map((bucket, index) => (
              <BucketListItem
                key={String(bucket.id)}
                bucket={bucket}
                isLast={index === visibleBuckets.length - 1}
                onToggleBucket={handleToggleBucket}
                onEditBucket={openEditBucket}
                disabled={pendingBucketIds.has(bucket.id)}
              />
            ))}
          </>
        )}

        {canToggle && (
          <Pressable
            style={styles.moreButton}
            onPress={() => setIsExpanded(prev => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
          >
            <AppText style={styles.moreButtonText}>
              {isExpanded ? '접기' : `${buckets.length - 5}개 더보기`}
            </AppText>

            {isExpanded ? (
              <ChevronUp size={16} color={'#666666'} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={16} color={'#666666'} strokeWidth={2.5} />
            )}
          </Pressable>
        )}
      </View>

      <BucketEditModal
        visible={isEditorVisible}
        bucket={editingBucket}
        onClose={() => setIsEditorVisible(false)}
        onAddBucket={handleAddBucket}
        onUpdateBucket={handleUpdateBucket}
        onDeleteBucket={handleDeleteBucket}
        pending={
          editingBucket !== null && pendingBucketIds.has(editingBucket.id)
        }
      />

      {lastDeletedBucket !== null ? (
        <AppSnackbar
          message="버킷리스트를 삭제했어요"
          actionLabel="실행 취소"
          actionAccessibilityLabel="버킷리스트 삭제 실행 취소"
          actionLoading={isRestoring}
          onAction={handleUndoDelete}
        />
      ) : null}
    </View>
  );
}

function BucketListItem({
  bucket,
  isLast,
  onToggleBucket,
  onEditBucket,
  disabled,
}: {
  bucket: Bucket;
  isLast: boolean;
  onToggleBucket: (id: string) => Promise<boolean>;
  onEditBucket: (bucket: Bucket) => void;
  disabled: boolean;
}) {
  return (
    <View style={[styles.bucketItem, isLast && styles.bucketItemLast]}>
      <Pressable
        onPress={() => {
          onToggleBucket(bucket.id);
        }}
        style={styles.checkButton}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityLabel={`${bucket.title} 완료`}
        accessibilityState={{ checked: bucket.isCompleted, disabled }}
      >
        <View
          style={[
            styles.checkBox,
            bucket.isCompleted && styles.checkBoxCompleted,
            disabled && styles.checkBoxDisabled,
          ]}
        >
          {bucket.isCompleted && (
            <Check size={16} color={colors.onPrimary} strokeWidth={3} />
          )}
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.bucketItemTitleButton,
          pressed && !disabled && styles.buttonPressed,
        ]}
        onPress={() => onEditBucket(bucket)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${bucket.title} 수정`}
        accessibilityState={{ disabled }}
      >
        <AppText
          style={[
            styles.bucketItemText,
            bucket.isCompleted && styles.bucketItemTextCompleted,
          ]}
        >
          {bucket.title}
        </AppText>
      </Pressable>
    </View>
  );
}

export default BucketListSection;

const styles = StyleSheet.create({
  bucketSection: {
    marginTop: 46,
    paddingHorizontal: 24,
  },
  bucketHeader: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bucketTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
  },

  bucketCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 8,
  },
  emptyBucketBox: {
    minHeight: 108,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBucketTitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  moreButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  moreButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#666666',
  },

  bucketItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  bucketItemLast: {
    borderBottomWidth: 0,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#DADADA',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    width: 44,
    height: 44,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketItemTitleButton: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  checkBoxCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkBoxDisabled: {
    opacity: 0.5,
  },
  bucketItemText: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  bucketItemTextCompleted: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  buttonPressed: {
    opacity: 0.55,
  },
});
