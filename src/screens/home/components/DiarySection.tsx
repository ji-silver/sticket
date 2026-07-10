import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { MoreHorizontal, Plus } from 'lucide-react-native';
import DiaryCover from '../../../components/DiaryCover';
import type { Diary } from '../types';
import { fonts } from '../../../styles/fonts.ts';
import AppText from '../../../components/common/AppText.tsx';

interface DiarySectionProps {
  diaries: Diary[];
  selectedIndex: number;
  onChangeIndex: (index: number) => void;
  onPressAddDiary: () => void;
  onPressDiaryMenu: (diary: Diary) => void;
  onPressDiary: (diary: Diary) => void;
}

function DiarySection({
  diaries,
  selectedIndex,
  onChangeIndex,
  onPressAddDiary,
  onPressDiaryMenu,
  onPressDiary,
}: DiarySectionProps) {
  const hasDiaries = diaries.length > 0;
  const { width } = useWindowDimensions();

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const pageWidth = event.nativeEvent.layoutMeasurement.width;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    const clampedIndex = Math.min(Math.max(nextIndex, 0), diaries.length - 1);

    if (clampedIndex !== selectedIndex) {
      onChangeIndex(clampedIndex);
    }
  };

  return (
    <View style={styles.ticketBookSection}>
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>내 티켓북</AppText>

        {hasDiaries && (
          <Pressable
            style={styles.sectionMenuButton}
            onPress={() => onPressDiaryMenu(diaries[selectedIndex])}
            hitSlop={8}
          >
            <MoreHorizontal size={22} color="#777777" strokeWidth={2.5} />
          </Pressable>
        )}
      </View>
      {hasDiaries ? (
        <>
          <FlatList
            data={diaries}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <View style={[styles.diaryPage, { width }]}>
                <DiaryCard diary={item} onPressDiary={onPressDiary} />
              </View>
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
          />

          <View style={styles.pageDots}>
            {diaries.map((diary, index) => (
              <View
                key={String(diary.id)}
                style={[
                  styles.pageDot,
                  index === selectedIndex && styles.pageDotActive,
                ]}
              />
            ))}
          </View>
        </>
      ) : (
        <EmptyDiaryState onPressAddDiary={onPressAddDiary} />
      )}
    </View>
  );
}

function DiaryCard({
  diary,
  onPressDiary,
}: {
  diary: Diary;
  onPressDiary: (diary: Diary) => void;
}) {
  const recordText =
    diary.recordCount > 0 ? `${diary.recordCount}개의 기록` : '기록 없음';

  return (
    <View style={styles.diaryCard}>
      <Pressable
        style={styles.diaryPressArea}
        onPress={() => onPressDiary(diary)}
      >
        <View style={styles.coverContainer}>
          <DiaryCover
            size={168}
            coverColor={diary.coverColor}
            photoUri={diary.photoUri}
          />
        </View>

        <View style={styles.diaryTextBox}>
          <AppText style={styles.diaryTitle}>{diary.title}</AppText>
          <AppText style={styles.recordCount}>{recordText}</AppText>
        </View>
      </Pressable>
    </View>
  );
}

function EmptyDiaryState({ onPressAddDiary }: { onPressAddDiary: () => void }) {
  return (
    <View style={styles.emptyDiaryCard}>
      <DiaryCover coverColor="#F1F1F1" size={96} />

      <AppText style={styles.emptyDiaryTitle}>
        아직 만든 티켓북이 없어요
      </AppText>

      <Pressable style={styles.emptyDiaryButton} onPress={onPressAddDiary}>
        <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
        <AppText style={styles.emptyDiaryButtonText}>티켓북 만들기</AppText>
      </Pressable>
    </View>
  );
}

export default DiarySection;

const styles = StyleSheet.create({
  ticketBookSection: {
    paddingTop: 24,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 22,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: '#111111',
  },
  sectionMenuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  diaryPage: {
    alignItems: 'center',
  },
  diaryCard: {
    width: 192,
    alignItems: 'center',
    position: 'relative',
  },
  diaryPressArea: {
    width: 192,
    alignItems: 'center',
  },
  coverContainer: {
    width: 192,
    height: 198,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryTextBox: {
    width: 192,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  diaryTitle: {
    fontSize: 15,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
  },
  recordCount: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: '#8A8A8A',
    textAlign: 'center',
  },

  pageDots: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DDDDDD',
  },
  pageDotActive: {
    width: 18,
    backgroundColor: '#111111',
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
    fontFamily: fonts.extraBold,
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
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
