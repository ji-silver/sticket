import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';
import { updateTicketSeat } from '../../../features/ticket/ticket.service.ts';
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSeatDraft(seatName ?? '');
    }
  }, [seatName, visible]);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const savedSeatName = await updateTicketSeat(ticketId, seatDraft);

      onSaved(savedSeatName);
      onClose();
    } catch (error) {
      console.error('좌석 정보를 저장하지 못했습니다.', error);

      Alert.alert(
        '좌석 정보를 저장하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppBottomSheet
      visible={visible}
      title="좌석 정보"
      onClose={onClose}
      keyboardAvoiding
      closeAccessibilityLabel="좌석 정보 닫기"
    >
      <TextInput
        value={seatDraft}
        onChangeText={setSeatDraft}
        style={styles.input}
        placeholder="예: 1루 응원지정석 23블록"
        placeholderTextColor={colors.textPlaceholder}
        selectionColor={colors.primary}
        maxLength={100}
        returnKeyType="done"
        onSubmitEditing={handleSave}
        editable={!isSaving}
        autoFocus
        accessibilityLabel="좌석 정보"
      />

      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          isSaving && styles.saveButtonDisabled,
          pressed && !isSaving && styles.saveButtonPressed,
        ]}
        onPress={handleSave}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel="좌석 정보 저장"
        accessibilityState={{
          disabled: isSaving,
          busy: isSaving,
        }}
      >
        <AppText style={styles.saveButtonText}>
          {isSaving ? '저장 중' : '저장'}
        </AppText>
      </Pressable>
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
    borderRadius: 16,
    borderCurve: 'continuous',
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
});
