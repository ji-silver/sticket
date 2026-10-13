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
import { ChevronRight, MoreHorizontal, Plus } from 'lucide-react-native';
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
  const selectedDiary = diaries[selectedIndex] ?? diaries[0];

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
    <View
      style={[
        styles.ticketBookSection,
        hasDiaries && styles.populatedSection,
        isEmpty && styles.emptySection,
      ]}
    >
      {selectedDiary && !isLoading && (
        <Pressable
          ref={menuButtonRef}
          style={styles.sectionMenuButton}
          onPress={() => onPressDiaryMenu(selectedDiary, menuButtonRef)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${selectedDiary.title} 티켓북 메뉴`}
        >
          <MoreHorizontal size={22} color={colors.textSecondary} />
        </Pressable>
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

          {diaries.length > 1 && (
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
          )}
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
  const recordText = `티켓 ${diary.recordCount ?? 0}장`;

  return (
    <View style={styles.diaryCard}>
      <View style={styles.diaryHeader}>
        <AppText style={styles.diaryTitle}>{diary.title}</AppText>
        <AppText style={styles.recordCount}>{recordText}</AppText>
      </View>
      {/* 표지와 열기 안내를 한 터치 영역으로 묶어 같은 이동 동선을 중복 제공하지 않는다. */}
      <Pressable
        style={({ pressed }) => [
          styles.diaryPressArea,
          pressed && styles.coverPressed,
        ]}
        onPress={() => onPressDiary(diary)}
        accessibilityRole="button"
        accessibilityLabel={`${diary.title} 티켓 목록 보기`}
        accessibilityHint="저장한 티켓 목록을 엽니다"
      >
        <View style={styles.coverContainer}>
          <View style={styles.coverFrame}>
            <DiaryCover
              size={224}
              coverColor={diary.coverColor}
              coverPattern={diary.coverPattern}
              photoUri={diary.photoUri}
            />
          </View>
        </View>
        <View pointerEvents="none" style={styles.openBookHint}>
          <AppText style={styles.openBookText}>열기</AppText>
          <ChevronRight size={15} color={colors.text} strokeWidth={2} />
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
    paddingTop: 8,
  },
  populatedSection: {
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  emptySection: {
    // 작은 화면에서는 내용 높이를 유지해 만들기 버튼까지 스크롤할 수 있게 한다.
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 32,
  },
  sectionMenuButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    zIndex: 1,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    height: 286,
    alignItems: 'center',
    justifyContent: 'center',
  },

  diaryPage: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  diaryCard: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  diaryPressArea: {
    width: 264,
    alignItems: 'center',
  },
  coverPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  coverContainer: {
    width: '100%',
    marginTop: 8,
    height: 256,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverFrame: {
    width: 224 * 1.06,
    // SVG 하단의 빈 여백만 잘라 표지와 열기 안내의 간격을 맞춘다.
    height: 256,
    overflow: 'hidden',
    // SVG 오른쪽의 스트랩 여백을 보정해 표지 앞면이 화면 중앙에 오도록 한다.
    transform: [{ translateX: 8 }],
  },
  openBookHint: {
    minHeight: 36,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  openBookText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  diaryHeader: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    paddingRight: 44,
    minHeight: 44,
    columnGap: 10,
  },
  diaryTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
  },
  recordCount: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.textSecondary,
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
