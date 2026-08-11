import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { ReactNode, RefObject } from 'react';
import AppText from '../../../../components/common/AppText.tsx';
import GridPaper from './GridPaper.tsx';
import LinedPaper from './LinedPaper.tsx';
import DiaryDrawingCanvas, {
  type DiaryDrawingCanvasRef,
} from './DiaryDrawingCanvas.tsx';
import DiaryLayerPanel, {
  type DiaryLayerPanelItem,
} from './DiaryLayerPanel.tsx';
import { colors } from '../../../../styles/colors.ts';
import type { EditorSize } from './photoTransform.ts';
import type { DiaryItem } from './TicketDiaryPage.tsx';
import { useDiaryStore } from './store/useDiaryStore.ts';

interface DiaryCanvasAreaProps {
  displayedEditorWidth: number;
  displayedEditorHeight: number;
  editorSize: EditorSize;
  pageSize: EditorSize;
  editorScale: number;
  displayScaleY: number;
  isPhoneLayout: boolean;
  isLandscape: boolean;
  layerPanelEditorSize: EditorSize;
  layerPanelItems: DiaryLayerPanelItem[];
  selectedLayerId: string | null;
  drawingCanvasRef: RefObject<DiaryDrawingCanvasRef | null>;
  onEditorWrapperLayout: (event: LayoutChangeEvent) => void;
  onEditorCanvasRegionLayout: (event: LayoutChangeEvent) => void;
  onDeselectDiaryItem: () => void;
  onDrawingChange: () => void;
  onFinishDrawing: () => void;
  onSelectLayer: (id: string) => void;
  onMoveLayer: (layerId: string, targetIndex: number) => void;
  onCloseLayerPanel: () => void;
  renderDiaryItem: (item: DiaryItem, index: number) => ReactNode;
  children?: ReactNode;
}

export default function DiaryCanvasArea({
  displayedEditorWidth,
  displayedEditorHeight,
  editorSize,
  pageSize,
  editorScale,
  displayScaleY,
  isPhoneLayout,
  isLandscape,
  layerPanelEditorSize,
  layerPanelItems,
  selectedLayerId,
  drawingCanvasRef,
  onEditorWrapperLayout,
  onEditorCanvasRegionLayout,
  onDeselectDiaryItem,
  onDrawingChange,
  onFinishDrawing,
  onSelectLayer,
  onMoveLayer,
  onCloseLayerPanel,
  renderDiaryItem,
  children,
}: DiaryCanvasAreaProps) {
  const paperType = useDiaryStore(state => state.paperType);
  const orientation = useDiaryStore(state => state.orientation);
  const items = useDiaryStore(state => state.items);
  const drawingIndex = useDiaryStore(state => state.drawingIndex);
  const selectedTool = useDiaryStore(state => state.selectedTool);
  const isLayerPanelVisible = useDiaryStore(state => state.isLayerPanelVisible);

  return (
    <View style={styles.editorWrapper} onLayout={onEditorWrapperLayout}>
      <View
        style={[
          styles.editorCanvasRegion,
          isPhoneLayout && styles.phoneCanvasRegion,
        ]}
        onLayout={onEditorCanvasRegionLayout}
      >
        <View
          style={[
            styles.editorWorkspace,
            {
              width: displayedEditorWidth,
              height: displayedEditorHeight,
            },
          ]}
        >
          <View
            style={[
              styles.editorCanvasSlot,
              {
                width: displayedEditorWidth,
                height: displayedEditorHeight,
              },
            ]}
          >
            <View
              style={[
                styles.editorArea,
                {
                  width: displayedEditorWidth,
                  height: displayedEditorHeight,
                },
              ]}
            >
              <Pressable
                accessible={false}
                style={styles.editorBackground}
                onPress={onDeselectDiaryItem}
              >
                {paperType === 'grid' ? (
                  <GridPaper pageSize={pageSize} />
                ) : null}
                {paperType === 'lined' ? (
                  <LinedPaper pageSize={pageSize} />
                ) : null}
              </Pressable>

              {items.slice(0, drawingIndex).map(renderDiaryItem)}

              <DiaryDrawingCanvas
                key={orientation}
                ref={drawingCanvasRef}
                logicalSize={editorSize}
                displayScale={editorScale}
                displayScaleY={displayScaleY}
                isDrawingMode={selectedTool === 'drawing'}
                onDrawingChange={onDrawingChange}
              />

              <View
                pointerEvents={selectedTool === 'drawing' ? 'none' : 'box-none'}
                style={styles.foregroundItems}
              >
                {items.slice(drawingIndex).map(renderDiaryItem)}
              </View>

              {selectedTool === 'drawing' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="드로잉 완료"
                  hitSlop={8}
                  onPress={onFinishDrawing}
                  style={({ pressed }) => [
                    styles.drawingDoneButton,
                    pressed && styles.pressedDrawingDoneButton,
                  ]}
                >
                  <AppText size={14} weight="semiBold" color={colors.primary}>
                    완료
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>

          {!isLandscape && isLayerPanelVisible ? (
            <DiaryLayerPanel
              editorSize={layerPanelEditorSize}
              editorScale={editorScale}
              placement="overlay"
              items={layerPanelItems}
              selectedLayerId={selectedLayerId}
              onSelectLayer={onSelectLayer}
              onMoveLayer={onMoveLayer}
              onClose={onCloseLayerPanel}
            />
          ) : null}
        </View>

        {isLandscape && isLayerPanelVisible ? (
          <DiaryLayerPanel
            editorSize={layerPanelEditorSize}
            editorScale={editorScale}
            placement="side"
            items={layerPanelItems}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onMoveLayer={onMoveLayer}
            onClose={onCloseLayerPanel}
          />
        ) : null}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  editorWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },

  editorCanvasRegion: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  phoneCanvasRegion: {
    justifyContent: 'center',
  },

  editorWorkspace: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  editorCanvasSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  editorArea: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  editorBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  drawingDoneButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    minWidth: 60,
    height: 40,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },

  pressedDrawingDoneButton: {
    backgroundColor: colors.primarySoft,
  },

  foregroundItems: {
    ...StyleSheet.absoluteFill,
  },
});
