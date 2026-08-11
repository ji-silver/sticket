import {
  Alert,
  Image,
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
import { useEffect, useState } from 'react';
import DiaryActionSheet from './components/DiaryActionSheet.tsx';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { fonts } from '../../styles/fonts.ts';
import AppText from '../../components/common/AppText.tsx';
import { colors } from '../../styles/colors.ts';
import { useGetTicketBooks } from '../../features/ticket-book/api/useGetTicketBooks';
import { useGetBucketList } from '../../features/bucket-list/api/useGetBucketList';
import { useDeleteTicketBook } from '../../features/ticket-book/api/useDeleteTicketBook.ts';
import { useCreateBucketItem } from '../../features/bucket-list/api/useCreateBucketItem.ts';
import { useDeleteBucketItem } from '../../features/bucket-list/api/useDeleteBucketItem.ts';
import { useRestoreBucketItem } from '../../features/bucket-list/api/useRestoreBucketItem.ts';
import { useUpdateBucketItemCompleted } from '../../features/bucket-list/api/useUpdateBucketItemCompleted.ts';
import { useUpdateBucketItemTitle } from '../../features/bucket-list/api/useUpdateBucketItemTitle.ts';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SPORT_TITLES: Record<Diary['sport'], string> = {
  baseball: '야구',
  soccer: '축구',
  basketball: '농구',
  volleyball: '배구',
};

function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();

  const [selectedDiaryIndex, setSelectedDiaryIndex] = useState(0);
  const [menuDiary, setMenuDiary] = useState<Diary | null>(null);

  const {
    data: ticketBooks = [],
    isLoading: isLoadingTicketBooks,
    isError: isTicketBooksError,
  } = useGetTicketBooks();
  const { data: bucketList = [], isError: isBucketListError } =
    useGetBucketList(ticketBooks.map(b => b.id));

  const diaryList = ticketBooks.map(ticketBook => ({
    id: ticketBook.id,
    sport: ticketBook.sport,
    title: SPORT_TITLES[ticketBook.sport],
    recordCount: ticketBook.recordCount,
    coverColor: ticketBook.coverColor,
    coverPattern: ticketBook.coverPattern,
    coverPhotoPath: ticketBook.coverPhotoPath,
    photoUri: ticketBook.coverPhotoUrl ?? undefined,
  }));

  const hasDiaries = diaryList.length > 0;

  const bucketsByDiaryId: Record<string, Bucket[]> = {};
  ticketBooks.forEach(b => {
    bucketsByDiaryId[b.id] = [];
  });
  bucketList.forEach(item => {
    if (bucketsByDiaryId[item.ticketBookId]) {
      bucketsByDiaryId[item.ticketBookId].push(item);
    }
  });

  const selectedDiary = diaryList[selectedDiaryIndex];
  const selectedBuckets = selectedDiary
    ? bucketsByDiaryId[selectedDiary.id] ?? []
    : [];

  useEffect(() => {
    if (diaryList.length > 0) {
      setSelectedDiaryIndex(current =>
        Math.min(current, Math.max(diaryList.length - 1, 0)),
      );
    }
  }, [diaryList.length]);

  useEffect(() => {
    if (isTicketBooksError || isBucketListError) {
      Alert.alert('홈 정보를 불러오지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  }, [isTicketBooksError, isBucketListError]);

  const handlePressAddDiary = () => {
    navigation.navigate('AddDiary');
  };

  const handlePressDiary = () => {
    navigation.navigate('TicketList');
  };

  const createBucketMutation = useCreateBucketItem();
  const updateBucketCompletedMutation = useUpdateBucketItemCompleted();
  const updateBucketTitleMutation = useUpdateBucketItemTitle();
  const deleteBucketMutation = useDeleteBucketItem();
  const restoreBucketMutation = useRestoreBucketItem();

  const handleAddBucket = async (ticketBookId: string, title: string) => {
    try {
      await createBucketMutation.mutateAsync({ ticketBookId, title });
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
    try {
      await updateBucketCompletedMutation.mutateAsync({
        bucketItemId: bucket.id,
        isCompleted: nextIsCompleted,
      });
      return true;
    } catch (error) {
      console.error('버킷리스트 완료 상태를 변경하지 못했습니다.', error);
      Alert.alert(
        '완료 상태를 변경하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
      return false;
    }
  };

  const handleUpdateBucketTitle = async (bucket: Bucket, title: string) => {
    try {
      await updateBucketTitleMutation.mutateAsync({
        bucketItemId: bucket.id,
        title,
      });
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
      await deleteBucketMutation.mutateAsync(bucket.id);
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

  const handleRestoreBucket = async (bucket: Bucket, _index: number) => {
    try {
      await restoreBucketMutation.mutateAsync(bucket);
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
  const deleteTicketBookMutation = useDeleteTicketBook();

  const handleDeleteDiary = async (diaryId: string) => {
    try {
      await deleteTicketBookMutation.mutateAsync(diaryId);
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
              <View style={styles.logoFrame}>
                <Image
                  source={require('../../assets/auth/ticket_logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel="STICKET 로고"
                />
              </View>
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

  logoFrame: {
    width: 40,
    height: 40,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});
