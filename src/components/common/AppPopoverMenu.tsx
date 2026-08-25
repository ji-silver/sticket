import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import AppText from './AppText.tsx';

export interface AppPopoverMenuAction {
  label: string;
  accessibilityLabel?: string;
  tone?: 'default' | 'destructive';
  disabled?: boolean;
  onPress: () => void;
}

interface AppPopoverMenuProps {
  visible: boolean;
  anchorRef: RefObject<View | null> | null;
  actions: AppPopoverMenuAction[];
  onClose: () => void;
}

interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MENU_WIDTH = 180;
const ROW_HEIGHT = 48;
const SCREEN_INSET = 12;
const ANCHOR_GAP = 6;

export function getPopoverMenuPosition({
  anchor,
  menuWidth,
  menuHeight,
  screenWidth,
  screenHeight,
  safeTop,
  safeBottom,
}: {
  anchor: AnchorRect;
  menuWidth: number;
  menuHeight: number;
  screenWidth: number;
  screenHeight: number;
  safeTop: number;
  safeBottom: number;
}) {
  const minTop = safeTop + SCREEN_INSET;
  const maxTop = Math.max(
    minTop,
    screenHeight - safeBottom - SCREEN_INSET - menuHeight,
  );
  const below = anchor.y + anchor.height + ANCHOR_GAP;
  const preferredTop =
    below <= maxTop ? below : anchor.y - ANCHOR_GAP - menuHeight;

  return {
    left: Math.min(
      Math.max(anchor.x + anchor.width - menuWidth, SCREEN_INSET),
      screenWidth - SCREEN_INSET - menuWidth,
    ),
    top: Math.min(Math.max(preferredTop, minTop), maxTop),
  };
}

function AppPopoverMenu({
  visible,
  anchorRef,
  actions,
  onClose,
}: AppPopoverMenuProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    if (!visible || !anchorRef?.current) {
      setAnchor(null);
      return;
    }

    const target = anchorRef.current;
    const frame = requestAnimationFrame(() => {
      target.measureInWindow((x, y, targetWidth, targetHeight) => {
        setAnchor({ x, y, width: targetWidth, height: targetHeight });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [anchorRef, height, visible, width]);

  const close = () => {
    pendingActionRef.current = null;
    onClose();
  };

  const handleDismiss = () => {
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;
    pendingAction?.();
  };

  const menuWidth = Math.min(MENU_WIDTH, width - SCREEN_INSET * 2);
  const menuHeight = actions.length * ROW_HEIGHT;
  const position = anchor
    ? getPopoverMenuPosition({
        anchor,
        menuWidth,
        menuHeight,
        screenWidth: width,
        screenHeight: height,
        safeTop: insets.top,
        safeBottom: insets.bottom,
      })
    : null;

  return (
    <Modal
      visible={visible && position !== null}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={close}
      onDismiss={handleDismiss}
    >
      <View style={styles.screen}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessible={false}
        />

        {position ? (
          <View
            style={[
              styles.menu,
              { width: menuWidth, left: position.left, top: position.top },
            ]}
            accessibilityViewIsModal
          >
            {actions.map((action, index) => (
              <Pressable
                key={`${action.label}-${index}`}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && styles.rowDivider,
                  index === 0 && styles.firstRow,
                  index === actions.length - 1 && styles.lastRow,
                  pressed && !action.disabled && styles.rowPressed,
                ]}
                disabled={action.disabled}
                onPress={() => {
                  pendingActionRef.current = action.onPress;
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  action.accessibilityLabel ?? action.label
                }
                accessibilityState={{ disabled: action.disabled }}
              >
                <AppText
                  style={[
                    styles.label,
                    action.tone === 'destructive' && styles.destructiveLabel,
                    action.disabled && styles.disabledLabel,
                  ]}
                >
                  {action.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

export default AppPopoverMenu;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.16)',
  },
  row: {
    height: ROW_HEIGHT,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  firstRow: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderCurve: 'continuous',
  },
  lastRow: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderCurve: 'continuous',
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  label: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  destructiveLabel: {
    color: colors.error,
  },
  disabledLabel: {
    color: colors.textTertiary,
  },
});
