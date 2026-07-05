import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import DiaryCover from '../../components/DiaryCover.tsx';

interface Diary {
  id: string;
  title: string;
  recordCount: number;
  coverColor: string;
  photoUri?: string;
}

const diaries: Diary[] = [
  {
    id: 'baseball',
    title: '야구',
    recordCount: 12,
    coverColor: '#e1e1e1',
  },
  {
    id: 'soccer',
    title: '축구',
    recordCount: 3,
    coverColor: '#e1e1e1',
  },
  {
    id: 'basketball',
    title: '농구',
    recordCount: 0,
    coverColor: '#e1e1e1',
  },
];

function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.logo}>STICKET</Text>
            <Text style={styles.subtitle}>내가 모은 스포츠 티켓북</Text>
          </View>

          <Pressable style={styles.addButton}>
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>다이어리 추가</Text>
          </Pressable>
        </View>

        <View style={styles.headerDivider} />
      </View>

      <View style={styles.ticketBookSection}>
        <Text style={styles.sectionTitle}>내 티켓북</Text>
        <FlatList
          data={diaries}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <DiaryCard diary={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.diaryList}
        />
      </View>
    </SafeAreaView>
  );
}

function DiaryCard({ diary }: { diary: Diary }) {
  const recordText =
    diary.recordCount > 0 ? `${diary.recordCount}개의 기록` : '기록 없음';

  return (
    <Pressable style={styles.diaryCard}>
      <View style={styles.coverContainer}>
        <DiaryCover size={150} coverColor={diary.coverColor} />
      </View>

      <View style={styles.diaryTextBox}>
        <Text style={styles.diaryTitle}>{diary.title}</Text>
        <Text style={styles.recordCount}>{recordText}</Text>
      </View>
    </Pressable>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  headerRow: {
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F1F1F1',
  },
  logo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111111',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  addButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
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
});
