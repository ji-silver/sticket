import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bucket } from '../types.ts';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import BucketEditModal from './BucketEditModal.tsx';

interface BucketListSectionProps {
  initialBuckets: Bucket[];
}

function BucketListSection({ initialBuckets }: BucketListSectionProps) {
  const [buckets, setBuckets] = useState<Bucket[]>(initialBuckets);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState(false);

  const completedCount = buckets.filter(bucket => bucket.isCompleted).length;
  const visibleBuckets = isExpanded ? buckets : buckets.slice(0, 5);
  const canToggle = buckets.length > 5;
  const isBucketEmpty = buckets.length === 0;

  const handleToggleBucket = (id: number) => {
    setBuckets(prev =>
      prev.map(bucket =>
        bucket.id === id
          ? { ...bucket, isCompleted: !bucket.isCompleted }
          : bucket,
      ),
    );
  };

  const handleAddBucket = (title: string) => {
    setBuckets(prev => [
      ...prev, // 앞에 둠으로써 목록 뒤에 새 항목이 붙을 수 있음
      {
        id: Date.now(),
        title,
        isCompleted: false,
      },
    ]);
  };

  const handleUpdateBucket = (id: number, title: string) => {
    setBuckets(prev =>
      prev.map(bucket => (bucket.id === id ? { ...bucket, title } : bucket)),
    );
  };

  const handleDeleteBucket = (id: number) => {
    setBuckets(prev => prev.filter(bucket => bucket.id !== id));
  };

  return (
    <View style={styles.bucketSection}>
      <View style={styles.bucketHeader}>
        <View>
          <Text style={styles.bucketTitle}>올해 버킷리스트</Text>
          {!isBucketEmpty && (
            <Text style={styles.bucketProgress}>
              {completedCount} / ${buckets.length} 완료
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => setIsEditVisible(true)}
          style={styles.editButton}
          hitSlop={8}
        >
          <Text style={styles.editButtonText}>
            {isBucketEmpty ? '추가' : '수정'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.bucketCard}>
        {isBucketEmpty ? (
          <View style={styles.emptyBucketBox}>
            <Text style={styles.emptyBucketTitle}>
              올해 직관 목표를 추가해보세요
            </Text>
          </View>
        ) : (
          <>
            {visibleBuckets.map((bucket, index) => (
              <BucketListItem
                key={String(bucket.id)}
                bucket={bucket}
                isLast={index === visibleBuckets.length - 1}
                onToggleBucket={handleToggleBucket}
              />
            ))}
          </>
        )}

        {canToggle && (
          <Pressable
            style={styles.moreButton}
            onPress={() => setIsExpanded(prev => !prev)}
            hitSlop={8}
          >
            <Text style={styles.moreButtonText}>
              {isExpanded ? '접기' : '더보기'}
            </Text>

            {isExpanded ? (
              <ChevronUp size={16} color={'#666666'} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={16} color={'#666666'} strokeWidth={2.5} />
            )}
          </Pressable>
        )}
      </View>

      <BucketEditModal
        visible={isEditVisible}
        buckets={buckets}
        onClose={() => setIsEditVisible(false)}
        onToggleBucket={handleToggleBucket}
        onAddBucket={handleAddBucket}
        onUpdateBucket={handleUpdateBucket}
        onDeleteBucket={handleDeleteBucket}
      />
    </View>
  );
}

function BucketListItem({
  bucket,
  isLast,
  onToggleBucket,
}: {
  bucket: Bucket;
  isLast: boolean;
  onToggleBucket: (id: number) => void;
}) {
  return (
    <View style={[styles.bucketItem, isLast && styles.bucketItemLast]}>
      <Pressable
        onPress={() => onToggleBucket(bucket.id)}
        hitSlop={8}
        style={[
          styles.checkBox,
          bucket.isCompleted && styles.checkBoxCompleted,
        ]}
      >
        {bucket.isCompleted && (
          <Check size={16} color="#FFFFFF" strokeWidth={3} />
        )}
      </Pressable>

      <Text
        style={[
          styles.bucketItemText,
          bucket.isCompleted && styles.bucketItemTextCompleted,
        ]}
        numberOfLines={1}
      >
        {bucket.title}
      </Text>
    </View>
  );
}

export default BucketListSection;

const styles = StyleSheet.create({
  bucketSection: {
    marginTop: 34,
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
    fontWeight: '800',
    color: '#111111',
  },

  bucketCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  emptyBucketBox: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyBucketTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#777777',
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
    fontWeight: '800',
    color: '#666666',
  },

  bucketProgress: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8A8A',
  },
  editButton: {
    paddingHorizontal: 4,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#777777',
  },

  bucketItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
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
  checkBoxCompleted: {
    borderColor: '#111111',
    backgroundColor: '#111111',
  },
  bucketItemText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
  },
  bucketItemTextCompleted: {
    color: '#8F8F8F',
  },
});
