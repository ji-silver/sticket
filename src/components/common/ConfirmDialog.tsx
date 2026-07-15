import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import AppText from './AppText.tsx';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: 'primary' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = '취소',
  confirmTone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDestructive = confirmTone === 'destructive';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={onCancel}
          accessible={false}
        />

        <View
          style={styles.dialog}
          accessibilityRole="alert"
          accessibilityViewIsModal
        >
          <AppText style={styles.title}>{title}</AppText>

          {description ? (
            <AppText style={styles.description}>{description}</AppText>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <AppText style={styles.cancelButtonText}>{cancelLabel}</AppText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                isDestructive && styles.destructiveButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <AppText style={styles.confirmButtonText}>{confirmLabel}</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ConfirmDialog;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.65,
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.secondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  destructiveButton: {
    backgroundColor: '#D92D20',
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
