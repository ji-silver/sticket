import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bucket } from '../types.ts';
import { Check } from 'lucide-react-native';

interface BucketListSectionProps {
  buckets: Bucket[];
}

function BucketListSection({ buckets }: BucketListSectionProps) {
  const previewBuckets = buckets.slice(0, 5);
  const completedCount = buckets.filter(bucket => bucket.isCompleted).length;

  return (
    <View style={styles.bucketSection}>
      <View style={styles.bucketHeader}>
        <View>
          <Text style={styles.bucketTitle}>올해 버킷리스트</Text>
          <Text style={styles.bucketProgress}>
            {completedCount} / {buckets.length} 완료
          </Text>
        </View>

        {/* hitSlop은 padding 처럼 터치 가능영역을 눈에 보이는 영역보다 더 넓혀주는 옵션 */}
        <Pressable style={styles.viewAllButton} hitSlop={8}>
          <Text style={styles.viewAllText}>전체보기</Text>
        </Pressable>
      </View>

      <View style={styles.bucketCard}>
        {previewBuckets.map((bucket, index) => (
          <BucketListItem
            key={bucket.id}
            bucket={bucket}
            isLast={index === previewBuckets.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function BucketListItem({
  bucket,
  isLast,
}: {
  bucket: Bucket;
  isLast: boolean;
}) {
  return (
    <View style={[styles.bucketItem, isLast && styles.bucketItemLast]}>
      <View
        style={[
          styles.checkBox,
          bucket.isCompleted && styles.checkBoxCompleted,
        ]}
      >
        {bucket.isCompleted && (
          <Check size={16} color="#FFFFFF" strokeWidth={3} />
        )}
      </View>

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
  viewAllButton: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
  },

  bucketCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  bucketProgress: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8A8A',
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
