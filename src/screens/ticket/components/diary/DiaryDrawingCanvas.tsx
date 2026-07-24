import { StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { type PencilKitRef, PencilKitView } from 'react-native-pencil-kit';

interface DiaryDrawingCanvasProps {
  isDrawingMode: boolean;
}

function DiaryDrawingCanvas({ isDrawingMode }: DiaryDrawingCanvasProps) {
  const drawingCanvasRef = useRef<PencilKitRef>(null);

  useEffect(() => {
    if (isDrawingMode) {
      drawingCanvasRef.current?.showToolPicker();
    } else {
      drawingCanvasRef.current?.hideToolPicker();
    }
  }, [isDrawingMode]);

  return (
    <PencilKitView
      ref={drawingCanvasRef}
      pointerEvents={isDrawingMode ? 'auto' : 'none'}
      drawingPolicy="anyinput"
      backgroundColor="rgba(255, 255, 255, 0.01)"
      isOpaque={false}
      alwaysBounceHorizontal={false}
      alwaysBounceVertical={false}
      style={styles.canvas}
    />
  );
}

export default DiaryDrawingCanvas;

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
