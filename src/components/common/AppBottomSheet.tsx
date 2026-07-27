import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import AppText from './AppText.tsx';

interface AppBottomSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  description?: string;
  headerRight?: ReactNode;
  showCloseButton?: boolean;
  keyboardAvoiding?: boolean;
  large?: boolean;
  closeAccessibilityLabel?: string;
  onClosed?: () => void;
}

function AppBottomSheet({
  visible,
  title,
  onClose,
  children,
  description,
  headerRight,
  showCloseButton = true,
  keyboardAvoiding = false,
  large = false,
  closeAccessibilityLabel = '바텀시트 닫기',
  onClosed,
}: AppBottomSheetProps) {
  const { bottom } = useSafeAreaInsets();
  const [isPresented, setIsPresented] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (!isPresented) {
      if (visible) {
        setIsPresented(true);
      }
      return;
    }

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setIsPresented(false);
      }
    });
  }, [isPresented, progress, visible]);

  return (
    <Modal
      visible={isPresented}
      transparent
      animationType="none"
      onRequestClose={onClose}
      onDismiss={onClosed}
    >
      <KeyboardAvoidingView
        enabled={keyboardAvoiding}
        behavior="padding"
        style={styles.modalRoot}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeAccessibilityLabel}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.backdrop,
              { opacity: progress },
            ]}
          />
        </Pressable>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            large && styles.largeSheet,
            { paddingBottom: Math.max(bottom, 16) },
            {
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [72, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText style={styles.title}>{title}</AppText>

              {description !== undefined ? (
                <AppText style={styles.description}>{description}</AppText>
              ) : null}
            </View>

            {headerRight ??
              (showCloseButton ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={closeAccessibilityLabel}
                >
                  <X size={22} color={colors.textSecondary} strokeWidth={2.2} />
                </Pressable>
              ) : null)}
          </View>

          <View style={[styles.content, large && styles.flexContent]}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default AppBottomSheet;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  sheet: {
    maxHeight: '90%',
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },
  largeSheet: {
    height: '78%',
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    fontSize: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  description: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  closeButton: {
    width: 44,
    height: 44,
    marginTop: -8,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  content: {
    minHeight: 0,
  },
  flexContent: {
    flex: 1,
  },
});
