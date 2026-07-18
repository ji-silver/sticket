import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import AppText from './AppText.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';

interface ScreenHeaderProps {
  title: string;
  onPressBack: () => void;
  right?: ReactNode;
}

function ScreenHeader({
  title,
  onPressBack,
  right,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPressBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="뒤로 가기"
      >
        <ChevronLeft size={26} color={colors.text} strokeWidth={2.4} />
      </Pressable>

      <AppText
        style={styles.title}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </AppText>

      {right ? <View style={styles.rightSlot}>{right}</View> : null}
    </View>
  );
}

export default ScreenHeader;

const styles = StyleSheet.create({
  container: {
    height: 52,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 34,
    height: 34,
    marginLeft: -8,
    borderRadius: 17,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  title: {
    flex: 1,
    minWidth: 0,
    marginLeft: 2,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  rightSlot: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
