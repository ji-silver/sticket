import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import AppButton from '../../../components/common/AppButton.tsx';
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';
import { useUpdateTicketSeat } from '../../../features/ticket/api/useUpdateTicketSeat.ts';
import { getSeatNamesForGame } from '../../../features/ticket/seatCatalog.ts';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import StadiumSeatNameList from './StadiumSeatNameList.tsx';

interface TicketSeatEditSheetProps {
  visible: boolean;
  ticketId: string;
  stadiumName: string;
  homeTeamName: string;
  seatName: string | null;
  seatDetail: string | null;
  onSaved: (seat: {
    seatName: string | null;
    seatDetail: string | null;
  }) => void;
  onClose: () => void;
}

function TicketSeatEditSheet({
  visible,
  ticketId,
  stadiumName,
  homeTeamName,
  seatName,
  seatDetail,
  onSaved,
  onClose,
}: TicketSeatEditSheetProps) {
  const [seatNameDraft, setSeatNameDraft] = useState(seatName ?? '');
  const [seatDetailDraft, setSeatDetailDraft] = useState(seatDetail ?? '');
  const [mode, setMode] = useState<'form' | 'seatNames'>('form');
  const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(
    null,
  );
  const seatDetailInputRef = useRef<TextInput>(null);
  const shouldFocusSeatDetail = useRef(false);
  const updateTicketSeatMutation = useUpdateTicketSeat();
  const stadiumSeatNames = getSeatNamesForGame(stadiumName, homeTeamName);
  const canSelectSeatName = stadiumSeatNames.length > 0;

  useEffect(() => {
    if (visible) {
      setSeatNameDraft(seatName ?? '');
      setSeatDetailDraft(seatDetail ?? '');
      setMode('form');
    }
  }, [seatDetail, seatName, visible]);

  useEffect(() => {
    if (mode !== 'form') return;

    if (shouldFocusSeatDetail.current) {
      shouldFocusSeatDetail.current = false;
      seatDetailInputRef.current?.focus();
    }
  }, [mode]);

  const updateSeat = async (
    nextSeatName: string,
    nextSeatDetail: string,
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
        seatDetail: nextSeatDetail,
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

  const handleSave = () =>
    updateSeat(seatNameDraft, seatDetailDraft, 'save');
  const handleDelete = () => updateSeat('', '', 'delete');

  const showFormAndFocusDetail = () => {
    shouldFocusSeatDetail.current = true;
    setMode('form');
  };

  return (
    <AppBottomSheet
      visible={visible}
      title={mode === 'form' ? '좌석 정보' : '좌석명 선택'}
      onClose={onClose}
      keyboardAvoiding={mode === 'form'}
      large={mode === 'seatNames'}
      closeAccessibilityLabel={
        mode === 'form' ? '좌석 정보 닫기' : '좌석명 선택 닫기'
      }
    >
      {mode === 'seatNames' ? (
        <StadiumSeatNameList
          seatNames={stadiumSeatNames}
          seatName={seatNameDraft}
          onSelect={selectedSeatName => {
            setSeatNameDraft(selectedSeatName);
            showFormAndFocusDetail();
          }}
        />
      ) : (
        <>
          <View style={styles.fields}>
            <View style={styles.inputFrame}>
              <TextInput
                allowFontScaling={false}
                value={seatNameDraft}
                onChangeText={setSeatNameDraft}
                style={styles.input}
                placeholder="좌석명 직접 입력"
                placeholderTextColor={colors.textPlaceholder}
                selectionColor={colors.primary}
                maxLength={100}
                returnKeyType="next"
                onSubmitEditing={() => seatDetailInputRef.current?.focus()}
                editable={!updateTicketSeatMutation.isPending}
                autoFocus
                accessibilityLabel="좌석명"
              />

              {canSelectSeatName ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.seatNameSelectButton,
                    pressed && styles.seatNameSelectButtonPressed,
                  ]}
                  onPress={() => setMode('seatNames')}
                  accessibilityRole="button"
                  accessibilityLabel="좌석명 목록 열기"
                >
                  <ChevronDown
                    size={20}
                    color={colors.textSecondary}
                    strokeWidth={2}
                  />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.inputFrame}>
              <TextInput
                ref={seatDetailInputRef}
                allowFontScaling={false}
                value={seatDetailDraft}
                onChangeText={setSeatDetailDraft}
                style={styles.input}
                placeholder="블록 열 좌석 번호 입력"
                placeholderTextColor={colors.textPlaceholder}
                selectionColor={colors.primary}
                maxLength={100}
                returnKeyType="done"
                onSubmitEditing={handleSave}
                editable={!updateTicketSeatMutation.isPending}
                accessibilityLabel="상세 위치"
              />
            </View>
          </View>

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
            isLoading={pendingAction === 'save'}
            accessibilityRole="button"
            accessibilityLabel="좌석 정보 저장"
            accessibilityState={{
              disabled: updateTicketSeatMutation.isPending,
              busy: updateTicketSeatMutation.isPending,
            }}
          >
            <AppText style={styles.saveButtonText}>저장</AppText>
          </AppButton>

          {seatName || seatDetail ? (
            <AppButton
              style={({ pressed }) => [
                styles.deleteButton,
                pressed &&
                  !updateTicketSeatMutation.isPending &&
                  styles.deleteButtonPressed,
              ]}
              onPress={handleDelete}
              disabled={updateTicketSeatMutation.isPending}
              isLoading={pendingAction === 'delete'}
              loadingColor={colors.error}
              accessibilityLabel="좌석 정보 삭제"
              accessibilityState={{
                disabled: updateTicketSeatMutation.isPending,
                busy: pendingAction === 'delete',
              }}
            >
              <AppText style={styles.deleteButtonText}>좌석 정보 삭제</AppText>
            </AppButton>
          ) : null}
        </>
      )}
    </AppBottomSheet>
  );
}

export default TicketSeatEditSheet;

const styles = StyleSheet.create({
  fields: {
    gap: 12,
  },

  inputFrame: {
    height: 52,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    height: 50,
    padding: 0,
    paddingRight: 16,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  seatNameSelectButton: {
    width: 48,
    height: 50,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  seatNameSelectButtonPressed: {
    opacity: 0.55,
  },

  saveButton: {
    height: 52,
    marginTop: 18,
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
