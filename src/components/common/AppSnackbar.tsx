import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import AppText from './AppText.tsx';

interface AppSnackbarProps {
  message: string;
  horizontalInset?: number;
  bottomOffset?: number;
  actionLabel?: string;
  actionAccessibilityLabel?: string;
  actionLoading?: boolean;
  onAction?: () => void;
}

function AppSnackbar({
  message,
  horizontalInset = 0,
  bottomOffset,
  actionLabel,
  actionAccessibilityLabel = actionLabel,
  actionLoading = false,
  onAction,
}: AppSnackbarProps) {
  const { bottom } = useSafeAreaInsets();
  const hasAction = actionLabel !== undefined && onAction !== undefined;

  return (
    <View
      style={[
        styles.container,
        {
          right: horizontalInset,
          bottom: bottomOffset ?? Math.max(bottom, 12),
          left: horizontalInset,
        },
        !hasAction && styles.messageOnly,
      ]}
      pointerEvents={hasAction ? 'auto' : 'none'}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <AppText style={styles.message} numberOfLines={1}>
        {message}
      </AppText>

      {hasAction ? (
        <Pressable
          style={({ pressed }) => [
            styles.action,
            pressed && styles.actionPressed,
          ]}
          onPress={onAction}
          disabled={actionLoading}
          accessibilityRole="button"
          accessibilityLabel={actionAccessibilityLabel}
          accessibilityState={{ disabled: actionLoading }}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <AppText style={styles.actionText}>{actionLabel}</AppText>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

export default AppSnackbar;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 20,
    minHeight: 48,
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.text,
    boxShadow: '0 6px 14px rgba(0, 0, 0, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageOnly: {
    paddingRight: 16,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.onPrimary,
  },
  action: {
    minWidth: 76,
    minHeight: 44,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPressed: {
    opacity: 0.55,
  },
  actionText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
