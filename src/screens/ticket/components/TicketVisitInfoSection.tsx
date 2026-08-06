import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';
import ConfirmDialog from '../../../components/common/ConfirmDialog.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { useDeleteTicketOriginalPhoto } from '../../../features/ticket/api/useDeleteTicketOriginalPhoto.ts';
import { useUpdateTicketOriginalPhoto } from '../../../features/ticket/api/useUpdateTicketOriginalPhoto.ts';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import {
  type OriginalTicketImageSource,
  pickOriginalTicketImage,
} from './OriginalTicketImageField.tsx';
import TicketSeatEditSheet from './TicketSeatEditSheet.tsx';

interface TicketVisitInfoSectionProps {
  ticketId: string;
  initialSeatName: string | null;
  initialOriginalTicketImageUri?: string;
  onFeedback: (message: string) => void;
}

function TicketVisitInfoSection({
  ticketId,
  initialSeatName,
  initialOriginalTicketImageUri,
  onFeedback,
}: TicketVisitInfoSectionProps) {
  const { top, bottom } = useSafeAreaInsets();
  const [seatName, setSeatName] = useState(initialSeatName);
  const [isSeatSheetVisible, setIsSeatSheetVisible] = useState(false);
  const [isOriginalTicketVisible, setIsOriginalTicketVisible] = useState(false);
  const [originalTicketImageUri, setOriginalTicketImageUri] = useState(
    initialOriginalTicketImageUri,
  );
  const [
    isOriginalTicketEditSheetVisible,
    setIsOriginalTicketEditSheetVisible,
  ] = useState(false);
  const [
    isOriginalTicketSourceSheetVisible,
    setIsOriginalTicketSourceSheetVisible,
  ] = useState(false);
  const [
    isOriginalTicketDeleteDialogVisible,
    setIsOriginalTicketDeleteDialogVisible,
  ] = useState(false);
  const [isSavingOriginalTicket, setIsSavingOriginalTicket] = useState(false);

  const updatePhotoMutation = useUpdateTicketOriginalPhoto();
  const deletePhotoMutation = useDeleteTicketOriginalPhoto();
  const pendingOriginalTicketEditAction = useRef<'change' | 'delete' | null>(
    null,
  );
  const shouldOpenOriginalTicketEditSheet = useRef(false);
  const pendingOriginalTicketImageSource =
    useRef<OriginalTicketImageSource | null>(null);

  const handlePressOriginalTicket = () => {
    if (isSavingOriginalTicket) return;

    if (originalTicketImageUri) {
      setIsOriginalTicketVisible(true);
    } else {
      setIsOriginalTicketSourceSheetVisible(true);
    }
  };

  const requestOriginalTicketEdit = (action: 'change' | 'delete') => {
    pendingOriginalTicketEditAction.current = action;
    setIsOriginalTicketEditSheetVisible(false);
  };

  const handlePressOriginalTicketEdit = () => {
    if (isSavingOriginalTicket) return;

    shouldOpenOriginalTicketEditSheet.current = true;
    setIsOriginalTicketVisible(false);
  };

  const handleOriginalTicketViewerClosed = () => {
    if (!shouldOpenOriginalTicketEditSheet.current) return;

    shouldOpenOriginalTicketEditSheet.current = false;
    setIsOriginalTicketEditSheetVisible(true);
  };

  const handleOriginalTicketEditSheetClosed = () => {
    const action = pendingOriginalTicketEditAction.current;
    pendingOriginalTicketEditAction.current = null;

    if (action === 'change') {
      setIsOriginalTicketSourceSheetVisible(true);
    } else if (action === 'delete') {
      setIsOriginalTicketDeleteDialogVisible(true);
    }
  };

  const requestOriginalTicketImage = (source: OriginalTicketImageSource) => {
    pendingOriginalTicketImageSource.current = source;
    setIsOriginalTicketSourceSheetVisible(false);
  };

  const handleOriginalTicketSourceSheetClosed = async () => {
    const source = pendingOriginalTicketImageSource.current;
    pendingOriginalTicketImageSource.current = null;

    if (!source) return;

    try {
      const result = await pickOriginalTicketImage(source);

      if (result) {
        setIsSavingOriginalTicket(true);

        const savedPhotoUri = await updatePhotoMutation.mutateAsync({
          ticketId,
          photoBase64: result.base64,
        } as any);

        setOriginalTicketImageUri(savedPhotoUri as unknown as string);
        onFeedback('티켓 사진을 변경했어요.');
        setIsOriginalTicketSourceSheetVisible(false);
      }
    } catch (error) {
      console.error('티켓 사진을 변경하지 못했습니다.', error);
      Alert.alert(
        '티켓 사진을 변경하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSavingOriginalTicket(false);
    }
  };

  const handleDeleteOriginalTicket = async () => {
    setIsSavingOriginalTicket(true);

    try {
      await deletePhotoMutation.mutateAsync(ticketId);

      setOriginalTicketImageUri(undefined);
      setIsOriginalTicketDeleteDialogVisible(false);
      setIsOriginalTicketVisible(false);

      onFeedback('티켓 사진을 삭제했어요.');
    } catch (error) {
      console.error('티켓 사진을 삭제하지 못했습니다.', error);
      Alert.alert(
        '티켓 사진을 삭제하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSavingOriginalTicket(false);
    }
  };

  return (
    <>
      <View style={styles.area}>
        <View style={styles.card}>
          <View style={styles.blockHeader}>
            <AppText style={styles.blockTitle}>좌석</AppText>

            <InlineActionButton
              label={seatName ? '수정' : '입력'}
              tone="primary"
              onPress={() => setIsSeatSheetVisible(true)}
              accessibilityLabel={
                seatName
                  ? `좌석 정보 ${seatName}, 수정하기`
                  : '좌석 정보 입력하기'
              }
            />
          </View>

          <AppText
            style={[styles.seatValue, !seatName && styles.placeholderText]}
            numberOfLines={2}
          >
            {seatName ?? '좌석을 입력해 주세요'}
          </AppText>

          <View style={styles.divider} />

          <View style={styles.blockHeader}>
            <AppText style={styles.blockTitle}>원본 티켓</AppText>

            <InlineActionButton
              label={originalTicketImageUri ? '보기' : '추가'}
              tone="primary"
              onPress={handlePressOriginalTicket}
              accessibilityLabel={
                originalTicketImageUri
                  ? '원본 티켓 전체 보기'
                  : '원본 티켓 사진 추가'
              }
            />
          </View>
        </View>
      </View>

      <TicketSeatEditSheet
        visible={isSeatSheetVisible}
        ticketId={ticketId}
        seatName={seatName}
        onSaved={setSeatName}
        onClose={() => setIsSeatSheetVisible(false)}
      />

      <AppBottomSheet
        visible={isOriginalTicketEditSheetVisible}
        title="원본 티켓 편집"
        onClose={() => setIsOriginalTicketEditSheetVisible(false)}
        onClosed={handleOriginalTicketEditSheetClosed}
        closeAccessibilityLabel="원본 티켓 편집 닫기"
      >
        <View style={styles.ticketActionList}>
          <TicketPhotoActionRow
            title="사진 변경"
            onPress={() => requestOriginalTicketEdit('change')}
          />

          <View style={styles.ticketActionDivider} />

          <TicketPhotoActionRow
            title="사진 삭제"
            tone="destructive"
            onPress={() => requestOriginalTicketEdit('delete')}
          />
        </View>
      </AppBottomSheet>

      <AppBottomSheet
        visible={isOriginalTicketSourceSheetVisible}
        title={originalTicketImageUri ? '티켓 사진 변경' : '티켓 사진 추가'}
        description="티켓 앞면이 잘 보이는 사진을 선택해 주세요"
        onClose={() => setIsOriginalTicketSourceSheetVisible(false)}
        onClosed={handleOriginalTicketSourceSheetClosed}
        closeAccessibilityLabel="티켓 사진 선택 닫기"
      >
        <View style={styles.ticketActionList}>
          <TicketPhotoActionRow
            title="사진 촬영"
            onPress={() => requestOriginalTicketImage('camera')}
          />

          <View style={styles.ticketActionDivider} />

          <TicketPhotoActionRow
            title="앨범에서 선택"
            onPress={() => requestOriginalTicketImage('library')}
          />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={isOriginalTicketDeleteDialogVisible}
        title="원본 티켓 사진을 삭제할까요?"
        description="삭제한 사진은 되돌릴 수 없어요."
        confirmLabel="삭제"
        confirmTone="destructive"
        isLoading={isSavingOriginalTicket}
        onConfirm={handleDeleteOriginalTicket}
        onCancel={() => setIsOriginalTicketDeleteDialogVisible(false)}
      />

      {originalTicketImageUri ? (
        <Modal
          visible={isOriginalTicketVisible}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsOriginalTicketVisible(false)}
          onDismiss={handleOriginalTicketViewerClosed}
        >
          <View
            style={[
              styles.originalTicketViewer,
              { paddingTop: top, paddingBottom: bottom },
            ]}
          >
            <StatusBar barStyle="dark-content" />

            <View style={styles.originalTicketViewerHeader}>
              <AppText style={styles.originalTicketViewerTitle}>
                원본 티켓
              </AppText>

              <Pressable
                style={({ pressed }) => [
                  styles.originalTicketCloseButton,
                  pressed && styles.originalTicketCloseButtonPressed,
                ]}
                onPress={() => setIsOriginalTicketVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="원본 티켓 닫기"
              >
                <X size={24} color={colors.text} strokeWidth={2.2} />
              </Pressable>

              <View style={styles.originalTicketEditButton}>
                <InlineActionButton
                  label="편집"
                  tone="primary"
                  onPress={handlePressOriginalTicketEdit}
                  accessibilityLabel="원본 티켓 사진 편집"
                />
              </View>
            </View>

            <Image
              source={{ uri: originalTicketImageUri }}
              style={styles.originalTicketImage}
              resizeMode="contain"
              accessibilityLabel="원본 티켓 이미지"
            />
          </View>
        </Modal>
      ) : null}
    </>
  );
}

export default TicketVisitInfoSection;

interface TicketPhotoActionRowProps {
  title: string;
  tone?: 'default' | 'destructive';
  onPress: () => void;
}

function TicketPhotoActionRow({
  title,
  tone = 'default',
  onPress,
}: TicketPhotoActionRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.ticketActionRow,
        pressed && styles.ticketActionRowPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <AppText
        style={[
          styles.ticketActionText,
          tone === 'destructive' && styles.ticketActionTextDestructive,
        ]}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  card: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  blockHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  seatValue: {
    minHeight: 24,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: colors.border,
  },
  originalTicketViewer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  originalTicketViewerHeader: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originalTicketViewerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  originalTicketCloseButton: {
    position: 'absolute',
    left: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originalTicketCloseButtonPressed: {
    backgroundColor: colors.background,
  },
  originalTicketEditButton: {
    position: 'absolute',
    right: 10,
  },
  originalTicketImage: {
    flex: 1,
    width: '100%',
    marginVertical: 16,
  },
  ticketActionList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  ticketActionRow: {
    height: 58,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  ticketActionRowPressed: {
    backgroundColor: colors.background,
  },
  ticketActionText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  ticketActionTextDestructive: {
    color: '#D92D20',
  },
  ticketActionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
