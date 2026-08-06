import type { PropsWithChildren } from 'react';
import {
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

interface ResponsiveContentProps extends PropsWithChildren {
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

function ResponsiveContent({
  children,
  maxWidth,
  style,
}: ResponsiveContentProps) {
  const { width, height } = useWindowDimensions();
  const responsiveMaxWidth = maxWidth ?? (width > height ? 760 : 640);

  return (
    <View style={[styles.content, { maxWidth: responsiveMaxWidth }, style]}>
      {children}
    </View>
  );
}

export default ResponsiveContent;

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignSelf: 'center',
  },
});
