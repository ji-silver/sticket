import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import DiarySection from './components/DiarySection.tsx';
import { Bucket, Diary } from './types.ts';
import BucketListSection from './components/BucketListSection.tsx';
import { useNavigation } from '@react-navigation/core';
import { useState } from 'react';
import DiaryActionSheet from './components/DiaryActionSheet.tsx';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const initialDiaries: Diary[] = [
  {
    id: 1,
    title: '야구',
    recordCount: 12,
    coverColor: '#e1e1e1',
  },
  {
    id: 2,
    title: '축구',
    recordCount: 3,
    coverColor: '#e1e1e1',
  },
  {
    id: 3,
    title: '농구',
    recordCount: 0,
    coverColor: '#e1e1e1',
  },
];
const initialBucketsByDiaryId: Record<number, Bucket[]> = {
  1: [
    {
      id: 1,
      title: '야구장 원정 가기',
      isCompleted: false,
    },
    {
      id: 2,
      title: '개막전 직관하기',
      isCompleted: true,
    },
    {
      id: 3,
      title: '가을야구 직관하기',
      isCompleted: false,
    },
    {
      id: 4,
      title: '유니폼 사기',
      isCompleted: true,
    },
    {
      id: 5,
      title: '싸인 받기',
      isCompleted: false,
    },
    {
      id: 6,
      title: '친구랑 야구장 가기',
      isCompleted: false,
    },
  ],
  2: [],
  3: [],
};

function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [diaryList, setDiaryList] = useState<Diary[]>(initialDiaries);
  const [selectedDiaryIndex, setSelectedDiaryIndex] = useState(0);
  const [bucketsByDiaryId, setBucketsByDiaryId] = useState(
    initialBucketsByDiaryId,
  );
  const [menuDiary, setMenuDiary] = useState<Diary | null>(null);
  const hasDiaries = diaryList.length > 0;

  const selectedDiary = diaryList[selectedDiaryIndex];
  const selectedBuckets = selectedDiary
    ? bucketsByDiaryId[selectedDiary.id] ?? []
    : [];

  const handlePressAddDiary = () => {
    navigation.navigate('AddDiary');
  };

  const handlePressDiary = () => {
    navigation.navigate('TicketList');
  };

  const handleChangeSelectedBuckets = (nextBuckets: Bucket[]) => {
    if (!selectedDiary) return;

    setBucketsByDiaryId(prev => ({
      ...prev,
      [selectedDiary.id]: nextBuckets,
    }));
  };

  // 티켓북, 버킷리스트 같이 삭제
  const handleDeleteDiary = (diaryId: number) => {
    const nextDiaries = diaryList.filter(diary => diary.id !== diaryId); // 삭제할 티켓북빼고 새 목록 만들기

    setDiaryList(nextDiaries);
    setSelectedDiaryIndex(currentIndex => {
      const lastIndex = nextDiaries.length - 1;

      if (currentIndex > lastIndex) {
        return Math.max(lastIndex, 0); // 0일때 -1을 빼더라도 음수가 되지 않음
      }

      return currentIndex;
    });
    setBucketsByDiaryId(currentBucket => {
      const nextBuckets = { ...currentBucket }; // 기존 버킷리스트 객체 복사
      delete nextBuckets[diaryId]; // 삭제한 티켓북의 버킷리스트도 지우기
      return nextBuckets;
    });
  };

  // 티켓북 수정
  const handleUpdateDiary = () => {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* SafeAreaView 안전 영역을 위에만 적용하기 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.logo}>STICKET</Text>
              <Text style={styles.subtitle}>내가 모은 스포츠 티켓북</Text>
            </View>

            {hasDiaries && (
              <Pressable style={styles.addButton} onPress={handlePressAddDiary}>
                <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.addButtonText}>다이어리 추가</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.headerDivider} />
        </View>

        <DiarySection
          diaries={diaryList}
          selectedIndex={selectedDiaryIndex}
          onChangeIndex={setSelectedDiaryIndex}
          onPressAddDiary={handlePressAddDiary}
          onPressDiary={handlePressDiary}
          onPressDiaryMenu={setMenuDiary}
        />

        {selectedDiary && (
          <BucketListSection
            diaryId={selectedDiary.id}
            diaryTitle={selectedDiary.title}
            buckets={selectedBuckets}
            onChangeBuckets={handleChangeSelectedBuckets}
          />
        )}
      </ScrollView>

      <DiaryActionSheet
        visible={menuDiary !== null}
        diary={menuDiary}
        onClose={() => setMenuDiary(null)}
        onEditDiary={() => {
          setMenuDiary(null);
          navigation.navigate('AddDiary' as never);
        }}
        onDeleteDiary={diaryId => {
          handleDeleteDiary(diaryId);
          setMenuDiary(null);
        }}
      />
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 24,
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
