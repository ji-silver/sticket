import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRef, type RefObject } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react-native';
import DiaryCover from '../../../components/DiaryCover';
import type { Diary } from '../types';
import { fonts } from '../../../styles/fonts.ts';
import AppButton from '../../../components/common/AppButton.tsx';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';

interface DiarySectionProps {
  diaries: Diary[];
  isLoading: boolean;
  selectedIndex: number;
  onChangeIndex: (index: number) => void;
  onPressAddDiary: () => void;
  onPressDiaryMenu: (diary: Diary, anchorRef: RefObject<View | null>) => void;
  onPressDiary: (diary: Diary) => void;
}

function DiarySection({
  diaries,
  isLoading,
  selectedIndex,
  onChangeIndex,
  onPressAddDiary,
  onPressDiaryMenu,
  onPressDiary,
}: DiarySectionProps) {
  const hasDiaries = diaries.length > 0;
  const isEmpty = !isLoading && !hasDiaries;
  const { width } = useWindowDimensions();
  const menuButtonRef = useRef<View>(null);

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
    <View style={[styles.ticketBookSection, isEmpty && styles.emptySection]}>
      {hasDiaries && (
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>내 티켓북</AppText>

          <Pressable
            ref={menuButtonRef}
            style={styles.sectionMenuButton}
            onPress={() =>
              onPressDiaryMenu(diaries[selectedIndex], menuButtonRef)
            }
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${diaries[selectedIndex].title} 티켓북 메뉴`}
          >
            <MoreHorizontal size={22} color="#777777" strokeWidth={2.5} />
          </Pressable>
        </View>
      )}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : hasDiaries ? (
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
            coverPattern={diary.coverPattern}
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
    <View style={styles.emptyDiaryState}>
      {/* 무채색 표지는 아직 만들어진 티켓북이 없다는 의미를 유지한다. */}
      <DiaryCover coverColor="#F1F1F1" size={168} />

      <AppText style={styles.emptyDiaryDescription}>
        {'티켓북을 만든 뒤\n직관한 경기 티켓을 추가할 수 있어요.'}
      </AppText>

      <AppButton style={styles.emptyDiaryButton} onPress={onPressAddDiary}>
        <Plus size={16} color={colors.onPrimary} strokeWidth={2.5} />
        <AppText style={styles.emptyDiaryButtonText}>티켓북 만들기</AppText>
      </AppButton>
    </View>
  );
}

export default DiarySection;

const styles = StyleSheet.create({
  ticketBookSection: {
    paddingTop: 24,
  },
  emptySection: {
    // 작은 화면에서는 내용 높이를 유지해 만들기 버튼까지 스크롤할 수 있게 한다.
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 32,
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
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
  },
  sectionMenuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    height: 286,
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
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  recordCount: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.textTertiary,
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
  },
  emptyDiaryState: {
    marginHorizontal: 32,
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyDiaryDescription: {
    marginTop: 24,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyDiaryButton: {
    marginTop: 24,
    height: 52,
    paddingHorizontal: 22,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyDiaryButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
