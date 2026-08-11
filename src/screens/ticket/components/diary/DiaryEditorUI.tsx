import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AppSnackbar from '../../../../components/common/AppSnackbar.tsx';
import { colors } from '../../../../styles/colors.ts';
import DiaryStickerPicker from './DiaryStickerPicker.tsx';
import type { PaperType } from './DiaryPaperSelector.tsx';
import DiaryPaperSelector from './DiaryPaperSelector.tsx';
import DiaryTextToolbar from './DiaryTextToolbar.tsx';
import type { DiaryToolId } from './DiaryBottomToolbar.tsx';
import DiaryBottomToolbar from './DiaryBottomToolbar.tsx';
import type { DiaryStickerDefinition } from './diaryStickerPacks.ts';
import type { DiaryTextStyle } from './diaryText.ts';
import type { DiaryItem } from './TicketDiaryPage.tsx';
import { useDiaryStore } from './store/useDiaryStore.ts';

interface DiaryEditorOverlayUIProps {
  onAddSticker: (sticker: DiaryStickerDefinition) => void;
  onCloseStickerPicker: () => void;
  onSelectPaper: (type: PaperType) => void;
}

export function DiaryEditorOverlayUI({
  onAddSticker,
  onCloseStickerPicker,
  onSelectPaper,
}: DiaryEditorOverlayUIProps) {
  const selectedTool = useDiaryStore(state => state.selectedTool);

  const selectedStickerPackId = useDiaryStore(
    state => state.selectedStickerPackId,
  );

  const setSelectedStickerPackId = useDiaryStore(
    state => state.setSelectedStickerPackId,
  );

  const paperType = useDiaryStore(state => state.paperType);
  const orientation = useDiaryStore(state => state.orientation);

  return (
    <>
      {selectedTool === 'sticker' ? (
        <DiaryStickerPicker
          selectedPackId={selectedStickerPackId}
          onSelectPack={setSelectedStickerPackId}
          onSelectSticker={onAddSticker}
          onClose={onCloseStickerPicker}
        />
      ) : null}

      {selectedTool === 'paper' ? (
        <DiaryPaperSelector
          paperType={paperType}
          orientation={orientation}
          onSelect={onSelectPaper}
        />
      ) : null}
    </>
  );
}

interface DiaryEditorUIProps {
  selectedTextItem: DiaryItem | null | undefined;
  onChangeTextStyle: (patch: Partial<DiaryTextStyle>) => void;
  onPressTool: (toolId: DiaryToolId) => void;
}

export default function DiaryEditorUI({
  selectedTextItem,
  onChangeTextStyle,
  onPressTool,
}: DiaryEditorUIProps) {
  const selectedTool = useDiaryStore(state => state.selectedTool);

  const isLayerPanelVisible = useDiaryStore(state => state.isLayerPanelVisible);

  if (selectedTextItem?.type === 'text') {
    return (
      <DiaryTextToolbar
        textItem={selectedTextItem.data}
        onChangeStyle={onChangeTextStyle}
      />
    );
  }

  if (selectedTool === 'sticker' || selectedTool === 'drawing') {
    return null;
  }

  return (
    <DiaryBottomToolbar
      selectedTool={isLayerPanelVisible ? 'layers' : selectedTool}
      onPressTool={onPressTool}
    />
  );
}

interface DiaryEditorFeedbackUIProps {
  isLoading: boolean;
  snackbarMessage: string | null;
}

export function DiaryEditorFeedbackUI({
  isLoading,
  snackbarMessage,
}: DiaryEditorFeedbackUIProps) {
  return (
    <>
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {snackbarMessage ? (
        <AppSnackbar message={snackbarMessage} horizontalInset={24} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
