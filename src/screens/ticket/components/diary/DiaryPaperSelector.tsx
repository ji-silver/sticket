import { Pressable, StyleSheet, View } from 'react-native';
import AppText from '../../../../components/common/AppText.tsx';
import { colors } from '../../../../styles/colors.ts';
import GridPaper from './GridPaper.tsx';
import LinedPaper from './LinedPaper.tsx';
import type { TicketDiaryOrientation } from '../../../../features/ticket/types.ts';
import { getDiaryPageSize } from './diaryLayout.ts';

export const DIARY_PAPER_SELECTOR_HEIGHT = 140;

export type PaperType = 'plain' | 'grid' | 'lined';

interface DiaryPaperSelectorProps {
  paperType: PaperType;
  orientation: TicketDiaryOrientation;
  onSelect: (paperType: PaperType) => void;
}

function DiaryPaperSelector({
  paperType,
  orientation,
  onSelect,
}: DiaryPaperSelectorProps) {
  const pageSize = getDiaryPageSize(orientation);
  const previewOrientationStyle =
    orientation === 'landscape'
      ? styles.landscapePreview
      : styles.portraitPreview;

  return (
    <View style={styles.container}>
      <AppText size={13} weight="semiBold" color={colors.text}>
        속지 선택
      </AppText>

      <View style={styles.options}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="무지 속지"
          accessibilityState={{
            selected: paperType === 'plain',
          }}
          onPress={() => onSelect('plain')}
          style={({ pressed }) => [
            styles.option,
            pressed && styles.pressedOption,
          ]}
        >
          <View style={styles.previewSlot}>
            <View
              style={[
                styles.preview,
                previewOrientationStyle,
                paperType === 'plain' && styles.selectedPreview,
              ]}
            />
          </View>

          <AppText
            size={12}
            weight={paperType === 'plain' ? 'semiBold' : 'regular'}
            color={
              paperType === 'plain' ? colors.primary : colors.textSecondary
            }
          >
            무지
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="모눈 속지"
          accessibilityState={{
            selected: paperType === 'grid',
          }}
          onPress={() => onSelect('grid')}
          style={({ pressed }) => [
            styles.option,
            pressed && styles.pressedOption,
          ]}
        >
          <View style={styles.previewSlot}>
            <View
              style={[
                styles.preview,
                previewOrientationStyle,
                paperType === 'grid' && styles.selectedPreview,
              ]}
            >
              <GridPaper isPreview pageSize={pageSize} />
            </View>
          </View>

          <AppText
            size={12}
            weight={paperType === 'grid' ? 'semiBold' : 'regular'}
            color={paperType === 'grid' ? colors.primary : colors.textSecondary}
          >
            모눈
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="가로줄 속지"
          accessibilityState={{
            selected: paperType === 'lined',
          }}
          onPress={() => onSelect('lined')}
          style={({ pressed }) => [
            styles.option,
            pressed && styles.pressedOption,
          ]}
        >
          <View style={styles.previewSlot}>
            <View
              style={[
                styles.preview,
                previewOrientationStyle,
                paperType === 'lined' && styles.selectedPreview,
              ]}
            >
              <LinedPaper isPreview pageSize={pageSize} />
            </View>
          </View>

          <AppText
            size={12}
            weight={paperType === 'lined' ? 'semiBold' : 'regular'}
            color={
              paperType === 'lined' ? colors.primary : colors.textSecondary
            }
          >
            가로줄
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

export default DiaryPaperSelector;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: DIARY_PAPER_SELECTOR_HEIGHT,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  options: {
    flexDirection: 'row',
    gap: 20,
  },

  option: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },

  pressedOption: {
    opacity: 0.6,
  },

  previewSlot: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },

  preview: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },

  portraitPreview: {
    width: 56,
    height: 72,
  },

  landscapePreview: {
    width: 72,
    height: 48,
  },

  selectedPreview: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
});
