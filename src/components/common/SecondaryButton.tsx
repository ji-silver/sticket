import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import AppButton from './AppButton.tsx';
import AppText from './AppText.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';

type SecondaryButtonProps = Omit<
  ComponentProps<typeof AppButton>,
  'children' | 'loadingColor'
> & { label: string };

export default function SecondaryButton({
  label,
  style,
  disabled,
  isLoading,
  ...props
}: SecondaryButtonProps) {
  return (
    <AppButton
      {...props}
      disabled={disabled}
      isLoading={isLoading}
      loadingColor={colors.text}
      style={state => [
        styles.button,
        (state.pressed || disabled || isLoading) && styles.dimmed,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <AppText style={styles.label}>{label}</AppText>
    </AppButton>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, fontFamily: fonts.bold, color: colors.text },
  dimmed: { opacity: 0.55 },
});
