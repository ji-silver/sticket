import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { type PencilKitRef, PencilKitView } from 'react-native-pencil-kit';
import { type EditorSize } from './photoTransform.ts';

export interface DiaryDrawingCanvasRef {
  clear: () => void;
  hasDrawing: () => Promise<boolean>;
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
  const emptyDrawingBase64Ref = useRef<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const canvas = drawingCanvasRef.current;

    if (!canvas) {
      return () => {
        isActive = false;
      };
    }

    canvas
      .getBase64Data()
      .then(base64 => {
        if (isActive) {
          emptyDrawingBase64Ref.current = base64;
        }
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, []);

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
        const canvas = drawingCanvasRef.current;

        canvas?.clear();
        canvas
          ?.getBase64Data()
          .then(base64 => {
            emptyDrawingBase64Ref.current = base64;
          })
          .catch(() => undefined);
      },

      hasDrawing: async () => {
        const canvas = drawingCanvasRef.current;

        if (!canvas) {
          throw new Error('그림 캔버스를 불러올 수 없습니다.');
        }

        const nativeHasDrawing = canvas.hasDrawing as
          | (() => Promise<boolean>)
          | undefined;

        if (typeof nativeHasDrawing === 'function') {
          try {
            return await nativeHasDrawing();
          } catch {
            // 이전 네이티브 바이너리에서는 hasDrawing 메서드가 없을 수 있습니다.
          }
        }

        const base64 = await canvas.getBase64Data();

        if (emptyDrawingBase64Ref.current === null) {
          emptyDrawingBase64Ref.current = base64;
          return false;
        }

        return (
          base64.trim().length > 0 && base64 !== emptyDrawingBase64Ref.current
        );
      },

      getBase64Data: async () => {
        if (!drawingCanvasRef.current) {
          throw new Error('그림 캔버스를 불러올 수 없습니다.');
        }

        return drawingCanvasRef.current.getBase64Data();
      },

      loadBase64Data: async (base64: string) => {
        const canvas = drawingCanvasRef.current;

        if (!canvas) {
          throw new Error('그림 캔버스를 불러올 수 없습니다.');
        }

        if (emptyDrawingBase64Ref.current === null) {
          emptyDrawingBase64Ref.current = await canvas.getBase64Data();
        }

        await canvas.loadBase64Data(base64);
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
