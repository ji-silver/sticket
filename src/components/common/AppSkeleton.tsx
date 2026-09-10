import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  type DimensionValue,
  Easing,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../styles/colors.ts';

interface AppSkeletonProps {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

function AppSkeleton({
  width,
  height,
  borderRadius = 0,
  style,
}: AppSkeletonProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    if (measuredWidth === 0) {
      return;
    }

    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );

    progress.setValue(0);
    animation.start();

    return () => animation.stop();
  }, [measuredWidth, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-measuredWidth, measuredWidth],
  });

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            colors.skeletonBase,
            colors.skeletonShimmer,
            colors.skeletonBase,
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </Animated.View>
  );
}

export default AppSkeleton;

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
    backgroundColor: colors.skeletonBase,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '85%',
  },
  gradient: {
    flex: 1,
  },
});
