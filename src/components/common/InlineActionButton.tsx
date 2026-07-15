import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import AppText from './AppText.tsx';

interface InlineActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  tone?: 'primary' | 'secondary';
  accessibilityLabel?: string;
}

function InlineActionButton({
  label,
  onPress,
  icon,
  tone = 'secondary',
  accessibilityLabel = label,
}: InlineActionButtonProps) {
  const isPrimary = tone === 'primary';

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {icon}
      <AppText style={[styles.text, isPrimary && styles.textPrimary]}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default InlineActionButton;

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  buttonPressed: {
    opacity: 0.55,
  },
  text: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.secondary,
  },
  textPrimary: {
    color: colors.primary,
  },
});
