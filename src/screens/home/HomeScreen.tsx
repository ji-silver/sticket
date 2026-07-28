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
import {
  createBucketItem,
  deleteBucketItem,
  getBucketItems,
  restoreBucketItem,
  updateBucketItemCompleted,
  updateBucketItemTitle,
} from '../../features/bucket-list/bucketList.service.ts';

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

      const loadHomeData = async () => {
        try {
          const ticketBooks = await getTicketBooks();
          const bucketItems = await getBucketItems(
            ticketBooks.map(ticketBook => ticketBook.id),
          );

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
          const nextBucketsByDiaryId = Object.fromEntries(
            ticketBooks.map(ticketBook => [ticketBook.id, [] as Bucket[]]),
          );

          bucketItems.forEach(bucketItem => {
            nextBucketsByDiaryId[bucketItem.ticketBookId]?.push(bucketItem);
          });

          setDiaryList(diaries);
          setBucketsByDiaryId(nextBucketsByDiaryId);
          setSelectedDiaryIndex(currentIndex =>
            Math.min(currentIndex, Math.max(diaries.length - 1, 0)),
          );
        } catch (error) {
          if (!isActive) {
            return;
          }

          console.error('홈 데이터를 불러오지 못했습니다.', error);
          Alert.alert(
            '홈 정보를 불러오지 못했어요',
            '잠시 후 다시 시도해 주세요.',
          );
        } finally {
          if (isActive) {
            setIsLoadingTicketBooks(false);
          }
        }
      };

      loadHomeData();

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

  const handleAddBucket = async (ticketBookId: string, title: string) => {
    try {
      const createdBucket = await createBucketItem(ticketBookId, title);

      setBucketsByDiaryId(currentBuckets => ({
        ...currentBuckets,
        [ticketBookId]: [
          ...(currentBuckets[ticketBookId] ?? []),
          createdBucket,
        ],
      }));

      return true;
    } catch (error) {
      console.error('버킷리스트를 추가하지 못했습니다.', error);
      Alert.alert(
        '버킷리스트를 추가하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
      return false;
    }
  };

  const handleToggleBucket = async (bucket: Bucket) => {
    const nextIsCompleted = !bucket.isCompleted;

    setBucketsByDiaryId(currentBuckets => ({
      ...currentBuckets,
      [bucket.ticketBookId]: (currentBuckets[bucket.ticketBookId] ?? []).map(
        currentBucket =>
          currentBucket.id === bucket.id
            ? { ...currentBucket, isCompleted: nextIsCompleted }
            : currentBucket,
      ),
    }));

    try {
      await updateBucketItemCompleted(bucket.id, nextIsCompleted);
      return true;
    } catch (error) {
      setBucketsByDiaryId(currentBuckets => ({
        ...currentBuckets,
        [bucket.ticketBookId]: (currentBuckets[bucket.ticketBookId] ?? []).map(
          currentBucket =>
            currentBucket.id === bucket.id
              ? { ...currentBucket, isCompleted: bucket.isCompleted }
              : currentBucket,
        ),
      }));

      console.error('버킷리스트 완료 상태를 변경하지 못했습니다.', error);
      Alert.alert('완료 상태를 변경하지 못했어요', '잠시 후 다시 시도해 주세요.');
      return false;
    }
  };

  const handleUpdateBucketTitle = async (bucket: Bucket, title: string) => {
    try {
      const updatedBucket = await updateBucketItemTitle(bucket.id, title);

      setBucketsByDiaryId(currentBuckets => ({
        ...currentBuckets,
        [bucket.ticketBookId]: (currentBuckets[bucket.ticketBookId] ?? []).map(
          currentBucket =>
            currentBucket.id === bucket.id
              ? { ...currentBucket, title: updatedBucket.title }
              : currentBucket,
        ),
      }));

      return true;
    } catch (error) {
      console.error('버킷리스트 내용을 수정하지 못했습니다.', error);
      Alert.alert(
        '버킷리스트를 수정하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
      return false;
    }
  };

  const handleDeleteBucket = async (bucket: Bucket) => {
    try {
      await deleteBucketItem(bucket.id);

      setBucketsByDiaryId(currentBuckets => ({
        ...currentBuckets,
        [bucket.ticketBookId]: (
          currentBuckets[bucket.ticketBookId] ?? []
        ).filter(currentBucket => currentBucket.id !== bucket.id),
      }));

      return true;
    } catch (error) {
      console.error('버킷리스트를 삭제하지 못했습니다.', error);
      Alert.alert(
        '버킷리스트를 삭제하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
      return false;
    }
  };

  const handleRestoreBucket = async (bucket: Bucket, index: number) => {
    try {
      const restoredBucket = await restoreBucketItem(bucket);

      setBucketsByDiaryId(currentBuckets => {
        const nextBuckets = [
          ...(currentBuckets[bucket.ticketBookId] ?? []),
        ];
        nextBuckets.splice(index, 0, restoredBucket);

        return {
          ...currentBuckets,
          [bucket.ticketBookId]: nextBuckets,
        };
      });

      return true;
    } catch (error) {
      console.error('삭제한 버킷리스트를 복원하지 못했습니다.', error);
      Alert.alert(
        '버킷리스트를 복원하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
      return false;
    }
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
            onAddBucket={handleAddBucket}
            onToggleBucket={handleToggleBucket}
            onUpdateBucketTitle={handleUpdateBucketTitle}
            onDeleteBucket={handleDeleteBucket}
            onRestoreBucket={handleRestoreBucket}
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
