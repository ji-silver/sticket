import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import AppButton from '../../../components/common/AppButton.tsx';
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';
import type { TicketDiaryOrientation } from '../../../features/ticket/types.ts';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

interface TicketPageOrientationSheetProps {
  visible: boolean;
  isSaving: boolean;
  onConfirm: (orientation: TicketDiaryOrientation) => void;
}

const OPTIONS: ReadonlyArray<{
  id: TicketDiaryOrientation;
  label: string;
}> = [
  { id: 'portrait', label: '세로형' },
  { id: 'landscape', label: '가로형' },
];

export default function TicketPageOrientationSheet({
  visible,
  isSaving,
  onConfirm,
}: TicketPageOrientationSheetProps) {
  const [selectedOrientation, setSelectedOrientation] =
    useState<TicketDiaryOrientation>('portrait');

  return (
    <AppBottomSheet
      visible={visible}
      title="페이지 방향 선택"
      showCloseButton={false}
      onClose={() => {}}
    >
      <View style={styles.options}>
        {OPTIONS.map(option => {
          const isSelected = selectedOrientation === option.id;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityLabel={`${option.label} 페이지`}
              accessibilityState={{ selected: isSelected }}
              disabled={isSaving}
              onPress={() => setSelectedOrientation(option.id)}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.selectedOption,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.previewArea}>
                <View
                  style={[
                    styles.pagePreview,
                    option.id === 'portrait'
                      ? styles.portraitPreview
                      : styles.landscapePreview,
                    isSelected && styles.selectedPreview,
                  ]}
                />
              </View>

              <AppText
                style={[
                  styles.optionLabel,
                  isSelected && styles.selectedOptionLabel,
                ]}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppButton
        accessibilityRole="button"
        accessibilityLabel="페이지 방향 선택 완료"
        disabled={isSaving}
        onPress={() => onConfirm(selectedOrientation)}
        style={({ pressed }) => [
          styles.confirmButton,
          pressed && styles.confirmButtonPressed,
          isSaving && styles.disabledButton,
        ]}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <AppText style={styles.confirmLabel}>선택 완료</AppText>
        )}
      </AppButton>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    height: 132,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary50,
  },
  pressed: {
    opacity: 0.65,
  },
  previewArea: {
    width: 88,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagePreview: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  portraitPreview: {
    width: 48,
    height: 68,
  },
  landscapePreview: {
    width: 82,
    height: 54,
  },
  selectedPreview: {
    borderColor: colors.primary,
  },
  optionLabel: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  selectedOptionLabel: {
    color: colors.primary,
  },
  confirmButton: {
    height: 54,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  confirmButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  disabledButton: {
    opacity: 0.55,
  },
  confirmLabel: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
