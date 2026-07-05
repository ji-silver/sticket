import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import DiarySection from './components/DiarySection.tsx';
import { Diary } from './types.ts';

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
  const hasDiaries = diaries.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.logo}>STICKET</Text>
            <Text style={styles.subtitle}>내가 모은 스포츠 티켓북</Text>
          </View>

          {hasDiaries && (
            <Pressable style={styles.addButton}>
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addButtonText}>다이어리 추가</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.headerDivider} />
      </View>

      <DiarySection diaries={diaries} />
    </SafeAreaView>
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
});
