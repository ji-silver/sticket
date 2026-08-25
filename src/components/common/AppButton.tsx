import {
  ActivityIndicator,
  type ColorValue,
  Pressable,
  type PressableProps,
  StyleSheet,
} from 'react-native';
import { colors } from '../../styles/colors.ts';

type AppButtonProps = Omit<PressableProps, 'style'> & {
  style?: PressableProps['style'];
  isLoading?: boolean;
  loadingColor?: ColorValue;
};

export default function AppButton({
  style,
  isLoading = false,
  loadingColor = colors.onPrimary,
  disabled,
  accessibilityState,
  children,
  ...props
}: AppButtonProps) {
  const isDisabled = Boolean(disabled || isLoading);

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        disabled: isDisabled,
        busy: isLoading || accessibilityState?.busy,
      }}
      disabled={isDisabled}
      style={state => [
        styles.button,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          accessible={false}
          size="small"
          color={loadingColor}
        />
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    borderCurve: 'continuous',
  },
});
