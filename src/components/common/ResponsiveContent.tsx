import type { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface ResponsiveContentProps extends PropsWithChildren {
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

function ResponsiveContent({
  children,
  maxWidth = 640,
  style,
}: ResponsiveContentProps) {
  return <View style={[styles.content, { maxWidth }, style]}>{children}</View>;
}

export default ResponsiveContent;

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignSelf: 'center',
  },
});
