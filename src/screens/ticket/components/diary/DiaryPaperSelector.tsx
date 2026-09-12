import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import AppText from '../../../../components/common/AppText.tsx';
import { colors, diaryPaperColors } from '../../../../styles/colors.ts';
import GridPaper from './GridPaper.tsx';
import LinedPaper from './LinedPaper.tsx';
import type { TicketDiaryOrientation } from '../../../../features/ticket/types.ts';
import { getDiaryPageSize } from './diaryLayout.ts';
import type { TicketDiaryPaperColor } from '../../../../features/ticket/types.ts';

export const DIARY_PAPER_SELECTOR_HEIGHT = 182;

export type PaperType = 'plain' | 'grid' | 'lined';

const PAPER_COLOR_OPTIONS: {
  value: TicketDiaryPaperColor;
  label: string;
}[] = [
  { value: 'white', label: '흰색' },
  { value: 'cream', label: '크림' },
  { value: 'pink', label: '핑크' },
  { value: 'mint', label: '민트' },
  { value: 'blue', label: '블루' },
];

interface DiaryPaperSelectorProps {
  paperType: PaperType;
  paperColor: TicketDiaryPaperColor;
  orientation: TicketDiaryOrientation;
  onSelect: (paperType: PaperType) => void;
  onSelectColor: (paperColor: TicketDiaryPaperColor) => void;
}

function DiaryPaperSelector({
  paperType,
  paperColor,
  orientation,
  onSelect,
  onSelectColor,
}: DiaryPaperSelectorProps) {
  const pageSize = getDiaryPageSize(orientation);
  const previewOrientationStyle =
    orientation === 'landscape'
      ? styles.landscapePreview
      : styles.portraitPreview;

  return (
    <View style={styles.container}>
      <AppText size={13} weight="semiBold">
        속지 선택
      </AppText>

      <View
        style={[
          styles.paperOptions,
          orientation === 'landscape'
            ? styles.landscapePaperOptions
            : styles.portraitPaperOptions,
        ]}
      >
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
                { backgroundColor: diaryPaperColors[paperColor] },
                paperType === 'plain' && styles.selectedPreview,
              ]}
            />
          </View>

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
              <GridPaper
                isPreview
                pageSize={pageSize}
                backgroundColor={diaryPaperColors[paperColor]}
              />
            </View>
          </View>

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
              <LinedPaper
                isPreview
                pageSize={pageSize}
                backgroundColor={diaryPaperColors[paperColor]}
              />
            </View>
          </View>

        </Pressable>
      </View>

      <View style={styles.colorOptions}>
        {PAPER_COLOR_OPTIONS.map(option => {
          const isSelected = paperColor === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={`${option.label} 배경`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectColor(option.value)}
              style={({ pressed }) => [
                styles.colorOption,
                { backgroundColor: diaryPaperColors[option.value] },
                isSelected && styles.selectedColorOption,
                pressed && styles.pressedOption,
              ]}
            >
              {isSelected ? (
                <Check size={18} color={colors.primary} strokeWidth={2.5} />
              ) : null}
            </Pressable>
          );
        })}
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
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  paperOptions: {
    flexDirection: 'row',
  },

  portraitPaperOptions: {
    gap: 24,
    marginLeft: -8,
  },

  landscapePaperOptions: {
    gap: 16,
  },

  colorOptions: {
    flexDirection: 'row',
    gap: 12,
  },

  option: {
    width: 72,
    alignItems: 'center',
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

  colorOption: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    borderCurve: 'continuous',
  },

  selectedColorOption: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
});
