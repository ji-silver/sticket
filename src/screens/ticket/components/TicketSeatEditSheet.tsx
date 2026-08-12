import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import AppButton from '../../../components/common/AppButton.tsx';
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';
import { useUpdateTicketSeat } from '../../../features/ticket/api/useUpdateTicketSeat.ts';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

interface TicketSeatEditSheetProps {
  visible: boolean;
  ticketId: string;
  seatName: string | null;
  onSaved: (seatName: string | null) => void;
  onClose: () => void;
}

function TicketSeatEditSheet({
  visible,
  ticketId,
  seatName,
  onSaved,
  onClose,
}: TicketSeatEditSheetProps) {
  const [seatDraft, setSeatDraft] = useState(seatName ?? '');
  const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(
    null,
  );
  const updateTicketSeatMutation = useUpdateTicketSeat();

  useEffect(() => {
    if (visible) {
      setSeatDraft(seatName ?? '');
    }
  }, [seatName, visible]);

  const updateSeat = async (
    nextSeatName: string,
    action: 'save' | 'delete',
  ) => {
    if (updateTicketSeatMutation.isPending) {
      return;
    }

    setPendingAction(action);

    try {
      const savedSeatName = await updateTicketSeatMutation.mutateAsync({
        ticketId,
        seatName: nextSeatName,
      });

      onSaved(savedSeatName);
      onClose();
    } catch (error) {
      const actionLabel = action === 'delete' ? '삭제' : '저장';

      console.error(`좌석 정보를 ${actionLabel}하지 못했습니다.`, error);

      Alert.alert(
        `좌석 정보를 ${actionLabel}하지 못했어요`,
        '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleSave = () => updateSeat(seatDraft, 'save');
  const handleDelete = () => updateSeat('', 'delete');

  return (
    <AppBottomSheet
      visible={visible}
      title="좌석 정보"
      onClose={onClose}
      keyboardAvoiding
      closeAccessibilityLabel="좌석 정보 닫기"
    >
      <TextInput
        allowFontScaling={false}
        value={seatDraft}
        onChangeText={setSeatDraft}
        style={styles.input}
        placeholder="예: 1루 응원지정석 23블록"
        placeholderTextColor={colors.textPlaceholder}
        selectionColor={colors.primary}
        maxLength={100}
        returnKeyType="done"
        onSubmitEditing={handleSave}
        editable={!updateTicketSeatMutation.isPending}
        autoFocus
        accessibilityLabel="좌석 정보"
      />

      <AppButton
        style={({ pressed }) => [
          styles.saveButton,
          updateTicketSeatMutation.isPending && styles.saveButtonDisabled,
          pressed &&
            !updateTicketSeatMutation.isPending &&
            styles.saveButtonPressed,
        ]}
        onPress={handleSave}
        disabled={updateTicketSeatMutation.isPending}
        accessibilityRole="button"
        accessibilityLabel="좌석 정보 저장"
        accessibilityState={{
          disabled: updateTicketSeatMutation.isPending,
          busy: updateTicketSeatMutation.isPending,
        }}
      >
        <AppText style={styles.saveButtonText}>
          {pendingAction === 'save' ? '저장 중' : '저장'}
        </AppText>
      </AppButton>

      {seatName ? (
        <AppButton
          style={({ pressed }) => [
            styles.deleteButton,
            pressed &&
              !updateTicketSeatMutation.isPending &&
              styles.deleteButtonPressed,
          ]}
          onPress={handleDelete}
          disabled={updateTicketSeatMutation.isPending}
          accessibilityLabel="좌석 정보 삭제"
          accessibilityState={{
            disabled: updateTicketSeatMutation.isPending,
            busy: pendingAction === 'delete',
          }}
        >
          <AppText style={styles.deleteButtonText}>
            {pendingAction === 'delete' ? '삭제 중' : '좌석 정보 삭제'}
          </AppText>
        </AppButton>
      ) : null}
    </AppBottomSheet>
  );
}

export default TicketSeatEditSheet;

const styles = StyleSheet.create({
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  saveButton: {
    height: 52,
    marginTop: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },

  saveButtonDisabled: {
    opacity: 0.55,
  },

  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },

  deleteButton: {
    height: 48,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonPressed: {
    opacity: 0.55,
  },

  deleteButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.error,
  },
});
