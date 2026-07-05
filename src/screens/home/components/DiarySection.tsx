import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import DiaryCover from '../../../components/DiaryCover';
import type { Diary } from '../types';

interface DiarySectionProps {
  diaries: Diary[];
}

function DiarySection({ diaries }: DiarySectionProps) {
  const hasDiaries = diaries.length > 0;

  return (
    <View style={styles.ticketBookSection}>
      <Text style={styles.sectionTitle}>내 티켓북</Text>

      {hasDiaries ? (
        <FlatList
          data={diaries}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <DiaryCard diary={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.diaryList}
        />
      ) : (
        <EmptyDiaryState />
      )}
    </View>
  );
}

function DiaryCard({ diary }: { diary: Diary }) {
  const recordText =
    diary.recordCount > 0 ? `${diary.recordCount}개의 기록` : '기록 없음';

  return (
    <Pressable style={styles.diaryCard}>
      <View style={styles.coverContainer}>
        <DiaryCover
          size={150}
          coverColor={diary.coverColor}
          photoUri={diary.photoUri}
        />
      </View>

      <View style={styles.diaryTextBox}>
        <Text style={styles.diaryTitle}>{diary.title}</Text>
        <Text style={styles.recordCount}>{recordText}</Text>
      </View>
    </Pressable>
  );
}

function EmptyDiaryState() {
  return (
    <View style={styles.emptyDiaryCard}>
      <DiaryCover coverColor="#F1F1F1" size={96} />

      <Text style={styles.emptyDiaryTitle}>아직 만든 티켓북이 없어요</Text>

      <Pressable style={styles.emptyDiaryButton}>
        <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={styles.emptyDiaryButtonText}>티켓북 만들기</Text>
      </Pressable>
    </View>
  );
}

export default DiarySection;

const styles = StyleSheet.create({
  ticketBookSection: {
    paddingTop: 24,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    marginBottom: 16,
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
  },
  diaryList: {
    paddingHorizontal: 16,
  },
  diaryCard: {
    width: 160,
  },
  coverContainer: {
    width: 160,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryTextBox: {
    paddingLeft: 12,
  },
  diaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
  },
  recordCount: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A8A',
  },
  emptyDiaryCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 26,
  },
  emptyDiaryTitle: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
  },
  emptyDiaryButton: {
    marginTop: 22,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 23,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyDiaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
