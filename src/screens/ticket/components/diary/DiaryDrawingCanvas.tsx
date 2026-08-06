import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { type PencilKitRef, PencilKitView } from 'react-native-pencil-kit';
import { type EditorSize } from './photoTransform.ts';

export interface DiaryDrawingCanvasRef {
  clear: () => void;
  getBase64Data: () => Promise<string>;
  loadBase64Data: (base64: string) => Promise<void>;
}

interface DiaryDrawingCanvasProps {
  isDrawingMode: boolean;
  logicalSize: EditorSize;
  displayScale: number;
  displayScaleY: number;
  onDrawingChange?: () => void;
}

const DiaryDrawingCanvas = forwardRef<
  DiaryDrawingCanvasRef,
  DiaryDrawingCanvasProps
>(function DiaryDrawingCanvasComponent(
  { isDrawingMode, logicalSize, displayScale, displayScaleY, onDrawingChange },
  forwardedRef,
) {
  const drawingCanvasRef = useRef<PencilKitRef>(null);

  useEffect(() => {
    if (isDrawingMode) {
      drawingCanvasRef.current?.showToolPicker();
    } else {
      drawingCanvasRef.current?.hideToolPicker();
    }
  }, [isDrawingMode]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      clear: () => {
        drawingCanvasRef.current?.clear();
      },

      getBase64Data: async () => {
        if (!drawingCanvasRef.current) {
          throw new Error('그림 캔버스를 불러올 수 없습니다.');
        }

        return drawingCanvasRef.current.getBase64Data();
      },

      loadBase64Data: async (base64: string) => {
        if (!drawingCanvasRef.current) {
          throw new Error('그림 캔버스를 불러올 수 없습니다.');
        }

        await drawingCanvasRef.current.loadBase64Data(base64);
      },
    }),
    [],
  );

  const safeDisplayScale = Math.max(displayScale, 0.0001);
  const safeDisplayScaleY = Math.max(displayScaleY, 0.0001);

  return (
    <View
      pointerEvents={isDrawingMode ? 'auto' : 'none'}
      style={[
        styles.viewport,
        {
          width: logicalSize.width * safeDisplayScale,
          height: logicalSize.height * safeDisplayScaleY,
        },
      ]}
    >
      <PencilKitView
        ref={drawingCanvasRef}
        pointerEvents={isDrawingMode ? 'auto' : 'none'}
        drawingPolicy="anyinput"
        backgroundColor="rgba(255, 255, 255, 0.01)"
        isOpaque={false}
        alwaysBounceHorizontal={false}
        alwaysBounceVertical={false}
        onCanvasViewDrawingDidChange={onDrawingChange}
        style={[
          styles.canvas,
          {
            width: logicalSize.width,
            height: logicalSize.height,
            transform: [
              { scaleX: safeDisplayScale },
              { scaleY: safeDisplayScaleY },
            ],
          },
        ]}
      />
    </View>
  );
});

export default DiaryDrawingCanvas;

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },

  canvas: {
    transformOrigin: 'top left',
  },
});
