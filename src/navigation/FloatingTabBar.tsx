import { useContext, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import AppText from '../components/common/AppText';
import { colors } from '../styles/colors';

type TabButtonProps = {
  options: BottomTabNavigationOptions;
  name: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

function TabButton({
  options,
  name,
  focused,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const label = options.title ?? name;
  const color = focused ? colors.primary : colors.textSecondary;

  const animatePress = (pressed: boolean) => {
    scale.value = withTiming(pressed ? 0.94 : 1, {
      duration: 120,
      reduceMotion: ReduceMotion.System,
    });
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
      accessibilityState={{ selected: focused }}
      testID={options.tabBarButtonTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => animatePress(true)}
      onPressOut={() => animatePress(false)}
      style={styles.tab}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.tabContent, animatedStyle]}
      >
        {options.tabBarIcon?.({ focused, color, size: 22 })}
        <AppText
          size={11}
          lineHeight={14}
          color={color}
          weight={focused ? 'bold' : 'medium'}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

export default function FloatingTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const [rowWidth, setRowWidth] = useState(0);
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const tabWidth = rowWidth / state.routes.length;

  // 실제 행 너비로 이동 거리를 계산해 작은 화면과 회전 후에도 선택 표시가 탭과 맞는다.
  // OS의 동작 줄이기 설정에서는 이동과 눌림 애니메이션을 즉시 완료한다.
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(state.index * tabWidth, {
          duration: 240,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      },
    ],
  }));

  return (
    // 바 뒤까지 콘텐츠가 이어지게 겹쳐 배치한다. 측정 높이는 각 화면의 스크롤 끝 여백에만 쓴다.
    <View
      testID="floating-tab-bar"
      pointerEvents="box-none"
      onLayout={event => onHeightChange?.(event.nativeEvent.layout.height)}
      style={[
        styles.footer,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        },
      ]}
    >
      <View style={styles.bar}>
        <View
          accessibilityRole="tablist"
          style={styles.row}
          onLayout={event => setRowWidth(event.nativeEvent.layout.width)}
        >
          {rowWidth > 0 && (
            <Animated.View
              accessible={false}
              pointerEvents="none"
              style={[styles.indicator, { width: tabWidth }, indicatorStyle]}
            />
          )}
          {state.routes.map((route, index) => (
            <TabButton
              key={route.key}
              name={route.name}
              options={descriptors[route.key].options}
              focused={state.index === index}
              onPress={() => {
                // 표준 탭과 같은 이벤트 순서를 유지해야 재선택 시 맨 위로 스크롤과 이동 취소가 동작한다.
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (state.index !== index && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() =>
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                })
              }
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: 440,
    padding: 4,
    borderRadius: 32,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    height: 54,
    flexDirection: 'row',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 27,
    borderCurve: 'continuous',
    backgroundColor: colors.primary50,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
});
