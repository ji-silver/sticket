import { Pressable, type PressableProps, StyleSheet } from 'react-native';

type AppButtonProps = Omit<PressableProps, 'style'> & {
  style?: PressableProps['style'];
};

export default function AppButton({ style, ...props }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={state => [
        styles.button,
        typeof style === 'function' ? style(state) : style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    borderCurve: 'continuous',
  },
});
