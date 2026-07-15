import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import AppText from './AppText.tsx';

interface FilterChipProps {
  label: string | number;
  selected: boolean;
  onPress: () => void;
}

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={String(label)}
      accessibilityState={{ selected }}
    >
      <AppText style={[styles.text, selected && styles.textSelected]}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default FilterChip;

const styles = StyleSheet.create({
  chip: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.78,
  },
  text: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.secondary,
  },
  textSelected: {
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
