import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import DiarySection from './components/DiarySection.tsx';
import { Bucket, Diary } from './types.ts';
import BucketListSection from './components/BucketListSection.tsx';
import { useNavigation } from '@react-navigation/core';
import { useCallback, useState } from 'react';
import DiaryActionSheet from './components/DiaryActionSheet.tsx';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { fonts } from '../../styles/fonts.ts';
import AppText from '../../components/common/AppText.tsx';
import { colors } from '../../styles/colors.ts';
import { useFocusEffect } from '@react-navigation/native';
import {
  deleteTicketBook,
  getTicketBooks,
} from '../../features/ticket-book/ticketBook.service.ts';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [diaryList, setDiaryList] = useState<Diary[]>([]);
  const [selectedDiaryIndex, setSelectedDiaryIndex] = useState(0);
  const [bucketsByDiaryId, setBucketsByDiaryId] = useState<
    Record<string, Bucket[]>
  >({});
  const [menuDiary, setMenuDiary] = useState<Diary | null>(null);
  const [isLoadingTicketBooks, setIsLoadingTicketBooks] = useState(true);
  const hasDiaries = diaryList.length > 0;

  const selectedDiary = diaryList[selectedDiaryIndex];
  const selectedBuckets = selectedDiary
    ? bucketsByDiaryId[selectedDiary.id] ?? []
    : [];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      setIsLoadingTicketBooks(true);

      getTicketBooks()
        .then(ticketBooks => {
          if (!isActive) {
            return;
          }

          const diaries: Diary[] = ticketBooks.map(ticketBook => ({
            id: ticketBook.id,
            sport: ticketBook.sport,
            title: '야구',
            recordCount: 0,
            coverColor: ticketBook.coverColor,
            coverPattern: ticketBook.coverPattern,
            coverPhotoPath: ticketBook.coverPhotoPath,
            photoUri: ticketBook.coverPhotoUrl ?? undefined,
          }));

          setDiaryList(diaries);
          setSelectedDiaryIndex(currentIndex =>
            Math.min(currentIndex, Math.max(diaries.length - 1, 0)),
          );
        })
        .catch(error => {
          if (!isActive) {
            return;
          }

          console.error('티켓북 목록을 불러오지 못했습니다.', error);
          Alert.alert(
            '티켓북을 불러오지 못했어요',
            '잠시 후 다시 시도해 주세요.',
          );
        })
        .finally(() => {
          if (isActive) {
            setIsLoadingTicketBooks(false);
          }
        });

      return () => {
        isActive = false;
      };
    }, []),
  );

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
  const handleDeleteDiary = async (diaryId: string) => {
    try {
      await deleteTicketBook(diaryId);

      const nextDiaries = diaryList.filter(diary => diary.id !== diaryId);

      setDiaryList(nextDiaries);
      setSelectedDiaryIndex(currentIndex =>
        Math.min(currentIndex, Math.max(nextDiaries.length - 1, 0)),
      );
      setBucketsByDiaryId(currentBuckets => {
        const nextBuckets = { ...currentBuckets };
        delete nextBuckets[diaryId];
        return nextBuckets;
      });
    } catch (error) {
      console.error('티켓북을 삭제하지 못했습니다.', error);
      Alert.alert('티켓북을 삭제하지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  };

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
              <AppText style={styles.logo}>STICKET</AppText>
              <AppText style={styles.subtitle}>내가 모은 스포츠 티켓북</AppText>
            </View>

            {hasDiaries && (
              <Pressable style={styles.addButton} onPress={handlePressAddDiary}>
                <Plus size={16} color={colors.onPrimary} strokeWidth={2.5} />
                <AppText style={styles.addButtonText}>다이어리 추가</AppText>
              </Pressable>
            )}
          </View>

          <View style={styles.headerDivider} />
        </View>

        <DiarySection
          diaries={diaryList}
          isLoading={isLoadingTicketBooks}
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
        onEditDiary={diary => {
          setMenuDiary(null);
          navigation.navigate('AddDiary', { ticketBook: diary });
        }}
        onDeleteDiary={diaryId => {
          setMenuDiary(null);
          handleDeleteDiary(diaryId);
        }}
      />
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
    fontFamily: fonts.black,
    fontWeight: '900',
    color: colors.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  addButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
