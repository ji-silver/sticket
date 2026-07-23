import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import { MoveDiagonal2, RotateCw, X } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors } from '../../../../styles/colors.ts';
import {
  applyTransformations,
  clamp,
  constrainPhotoPosition,
  getMaximumPhotoScale,
  getTransformedPhotoPoint,
  MINIMUM_PHOTO_SCALE,
  type EditorSize,
  type Matrix3,
  type Point,
} from './photoTransform.ts';

const ITEM_HANDLE_TOUCH_SIZE = 44;
const ITEM_HANDLE_SIZE = 28;
const ROTATION_HANDLE_OFFSET = 28;

interface DiaryImageItemProps {
  source: ImageSourcePropType;
  width: number;
  height: number;
  initialMatrix: Matrix3;
  editorSize: EditorSize;
  isSelected: boolean;
  itemLabel: string;
  accessibilityLabel: string;
  onSelect: () => void;
  onChangeMatrix: (matrix: Matrix3) => void;
  onDelete: () => void;
}

function DiaryImageItem({
  source,
  width,
  height,
  initialMatrix,
  editorSize,
  isSelected,
  itemLabel,
  accessibilityLabel,
  onSelect,
  onChangeMatrix,
  onDelete,
}: DiaryImageItemProps) {
  const matrix = useSharedValue<Matrix3>(initialMatrix);
  const translation = useSharedValue<Point>({
    x: 0,
    y: 0,
  });
  const resizeStartVector = useSharedValue<Point>({
    x: 0,
    y: 0,
  });
  const resizeStartScale = useSharedValue(1);
  const rotationStartVector = useSharedValue<Point>({
    x: 0,
    y: 0,
  });
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const saveMatrix = (nextMatrix: Matrix3) => {
    onChangeMatrix(nextMatrix);
  };

  const commitCurrentTransform = () => {
    'worklet';

    const nextMatrix = applyTransformations(
      translation.value,
      scale.value,
      rotation.value,
      { x: 0, y: 0 },
      matrix.value,
    );

    const constrainedMatrix = constrainPhotoPosition(
      nextMatrix,
      width,
      height,
      editorSize,
    );

    matrix.value = constrainedMatrix;

    translation.value = {
      x: 0,
      y: 0,
    };

    scale.value = 1;
    rotation.value = 0;

    scheduleOnRN(saveMatrix, constrainedMatrix);
  };

  const deleteGesture = useTapGesture({
    enabled: isSelected,
    onActivate: () => {
      scheduleOnRN(onDelete);
    },
  });

  const resizeGesture = usePanGesture({
    enabled: isSelected,

    onActivate: () => {
      const savedScale = Math.max(
        Math.hypot(matrix.value[0], matrix.value[1]),
        0.0001,
      );
      const savedRotation = Math.atan2(matrix.value[1], matrix.value[0]);
      const halfWidth = (width * savedScale) / 2;
      const halfHeight = (height * savedScale) / 2;
      const cosine = Math.cos(savedRotation);
      const sine = Math.sin(savedRotation);

      resizeStartScale.value = savedScale;
      resizeStartVector.value = {
        x: cosine * halfWidth - sine * halfHeight,
        y: sine * halfWidth + cosine * halfHeight,
      };
    },

    onUpdate: event => {
      const startVector = resizeStartVector.value;
      const startDistance = Math.max(
        Math.hypot(startVector.x, startVector.y),
        0.0001,
      );
      const currentDistance = Math.hypot(
        startVector.x + event.translationX,
        startVector.y + event.translationY,
      );
      const savedRotation = Math.atan2(matrix.value[1], matrix.value[0]);
      const maximumScale = getMaximumPhotoScale(
        width,
        height,
        savedRotation,
        editorSize,
      );
      const minimumScale = Math.min(MINIMUM_PHOTO_SCALE, maximumScale);
      const nextScale = clamp(
        resizeStartScale.value * (currentDistance / startDistance),
        minimumScale,
        maximumScale,
      );

      scale.value = nextScale / resizeStartScale.value;
    },

    onDeactivate: commitCurrentTransform,
  });

  const rotationHandleGesture = usePanGesture({
    enabled: isSelected,

    onActivate: () => {
      const savedScale = Math.max(
        Math.hypot(matrix.value[0], matrix.value[1]),
        0.0001,
      );
      const savedRotation = Math.atan2(matrix.value[1], matrix.value[0]);
      const handleDistance =
        (height / 2) * savedScale + ROTATION_HANDLE_OFFSET;
      const handleAngle = savedRotation - Math.PI / 2;

      rotationStartVector.value = {
        x: Math.cos(handleAngle) * handleDistance,
        y: Math.sin(handleAngle) * handleDistance,
      };
    },

    onUpdate: event => {
      const startVector = rotationStartVector.value;
      const startAngle = Math.atan2(startVector.y, startVector.x);
      const currentAngle = Math.atan2(
        startVector.y + event.translationY,
        startVector.x + event.translationX,
      );
      let angleDelta = currentAngle - startAngle;

      if (angleDelta > Math.PI) {
        angleDelta -= Math.PI * 2;
      } else if (angleDelta < -Math.PI) {
        angleDelta += Math.PI * 2;
      }

      rotation.value = angleDelta;
    },

    onDeactivate: commitCurrentTransform,
  });

  const handleGestures = [
    deleteGesture,
    resizeGesture,
    rotationHandleGesture,
  ];

  const selectGesture = useTapGesture({
    requireToFail: handleGestures,
    onActivate: () => {
      scheduleOnRN(onSelect);
    },
  });

  const panGesture = usePanGesture({
    enabled: isSelected,
    averageTouches: true,
    requireToFail: handleGestures,

    onUpdate: event => {
      translation.value = {
        x: translation.value.x + event.changeX,
        y: translation.value.y + event.changeY,
      };
    },

    onDeactivate: commitCurrentTransform,
  });

  const itemGesture = useSimultaneousGestures(selectGesture, panGesture);

  const displayMatrix = useDerivedValue(() =>
    constrainPhotoPosition(
      applyTransformations(
        translation.value,
        scale.value,
        rotation.value,
        { x: 0, y: 0 },
        matrix.value,
      ),
      width,
      height,
      editorSize,
    ),
  );

  const animatedStyle = useAnimatedStyle(() => {
    const constrainedMatrix = displayMatrix.value;

    return {
      transform: [
        {
          translateX: constrainedMatrix[6],
        },
        {
          translateY: constrainedMatrix[7],
        },
        {
          scale: Math.hypot(constrainedMatrix[0], constrainedMatrix[1]),
        },
        {
          rotateZ: `${Math.atan2(
            constrainedMatrix[1],
            constrainedMatrix[0],
          )}rad`,
        },
      ],
    };
  });

  const deleteHandleStyle = useAnimatedStyle(() => {
    const point = getTransformedPhotoPoint(
      displayMatrix.value,
      width,
      height,
      0,
      0,
    );

    return {
      transform: [
        { translateX: point.x - ITEM_HANDLE_TOUCH_SIZE / 2 },
        { translateY: point.y - ITEM_HANDLE_TOUCH_SIZE / 2 },
      ],
    };
  });

  const rotationHandleStyle = useAnimatedStyle(() => {
    const matrixValue = displayMatrix.value;
    const rotationValue = Math.atan2(matrixValue[1], matrixValue[0]);
    const topCenter = getTransformedPhotoPoint(
      matrixValue,
      width,
      height,
      width / 2,
      0,
    );
    const point = {
      x: topCenter.x + Math.sin(rotationValue) * ROTATION_HANDLE_OFFSET,
      y: topCenter.y - Math.cos(rotationValue) * ROTATION_HANDLE_OFFSET,
    };

    return {
      transform: [
        { translateX: point.x - ITEM_HANDLE_TOUCH_SIZE / 2 },
        { translateY: point.y - ITEM_HANDLE_TOUCH_SIZE / 2 },
      ],
    };
  });

  const rotationConnectorStyle = useAnimatedStyle(() => {
    const matrixValue = displayMatrix.value;
    const rotationValue = Math.atan2(matrixValue[1], matrixValue[0]);
    const topCenter = getTransformedPhotoPoint(
      matrixValue,
      width,
      height,
      width / 2,
      0,
    );
    const middleX =
      topCenter.x +
      (Math.sin(rotationValue) * ROTATION_HANDLE_OFFSET) / 2;
    const middleY =
      topCenter.y -
      (Math.cos(rotationValue) * ROTATION_HANDLE_OFFSET) / 2;

    return {
      transform: [
        { translateX: middleX - 0.5 },
        { translateY: middleY - ROTATION_HANDLE_OFFSET / 2 },
        { rotateZ: `${rotationValue}rad` },
      ],
    };
  });

  const resizeHandleStyle = useAnimatedStyle(() => {
    const point = getTransformedPhotoPoint(
      displayMatrix.value,
      width,
      height,
      width,
      height,
    );

    return {
      transform: [
        { translateX: point.x - ITEM_HANDLE_TOUCH_SIZE / 2 },
        { translateY: point.y - ITEM_HANDLE_TOUCH_SIZE / 2 },
      ],
    };
  });

  return (
    <>
      <GestureDetector gesture={itemGesture}>
        <Animated.View
          style={[
            styles.itemContainer,
            {
              width,
              height,
            },
            animatedStyle,
          ]}
        >
          <Image
            accessible
            accessibilityRole="image"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ selected: isSelected }}
            source={source}
            resizeMode="contain"
            style={styles.image}
          />

          {isSelected ? (
            <View pointerEvents="none" style={styles.selectionBorder} />
          ) : null}
        </Animated.View>
      </GestureDetector>

      {isSelected ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.rotationConnector, rotationConnectorStyle]}
          />

          <GestureDetector gesture={deleteGesture}>
            <Animated.View
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${itemLabel} 삭제`}
              accessibilityHint={`선택한 ${itemLabel}을 삭제합니다`}
              onAccessibilityTap={onDelete}
              style={[styles.handleTouchArea, deleteHandleStyle]}
            >
              <View style={[styles.handleButton, styles.deleteButton]}>
                <X size={14} color="#D92D20" strokeWidth={2.1} />
              </View>
            </Animated.View>
          </GestureDetector>

          <GestureDetector gesture={rotationHandleGesture}>
            <Animated.View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={`${itemLabel} 회전`}
              accessibilityHint={`드래그하여 ${itemLabel}을 회전합니다`}
              style={[styles.handleTouchArea, rotationHandleStyle]}
            >
              <View style={styles.handleButton}>
                <RotateCw
                  size={14}
                  color={colors.primary}
                  strokeWidth={2.1}
                />
              </View>
            </Animated.View>
          </GestureDetector>

          <GestureDetector gesture={resizeGesture}>
            <Animated.View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={`${itemLabel} 크기 조절`}
              accessibilityHint={`드래그하여 ${itemLabel} 크기를 변경합니다`}
              style={[styles.handleTouchArea, resizeHandleStyle]}
            >
              <View style={[styles.handleButton, styles.resizeButton]}>
                <MoveDiagonal2
                  size={14}
                  color={colors.onPrimary}
                  strokeWidth={2.1}
                />
              </View>
            </Animated.View>
          </GestureDetector>
        </>
      ) : null}
    </>
  );
}

export default DiaryImageItem;

const styles = StyleSheet.create({
  itemContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectionBorder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1.25,
    borderColor: colors.primary,
  },
  rotationConnector: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: ROTATION_HANDLE_OFFSET,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  handleTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ITEM_HANDLE_TOUCH_SIZE,
    height: ITEM_HANDLE_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleButton: {
    width: ITEM_HANDLE_SIZE,
    height: ITEM_HANDLE_SIZE,
    borderRadius: 8,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: '0 3px 10px rgba(24, 27, 32, 0.16)',
  },
  deleteButton: {
    borderColor: '#F2C8C4',
    backgroundColor: '#FFF7F6',
  },
  resizeButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
