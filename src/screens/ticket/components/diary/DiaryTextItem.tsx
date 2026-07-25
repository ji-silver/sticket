import {
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  TextInput,
  type TextInputContentSizeChangeEvent,
  type TextInputSelectionChangeEvent,
  View,
} from 'react-native';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import { MoveHorizontal, RotateCw, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors } from '../../../../styles/colors.ts';
import { fonts } from '../../../../styles/fonts.ts';
import {
  constrainDiaryTextFrame,
  type DiaryText,
  type DiaryTextFrame,
  getDiaryTextPoint,
  MINIMUM_TEXT_HEIGHT,
  MINIMUM_TEXT_WIDTH,
} from './diaryText.ts';
import { type EditorSize } from './photoTransform.ts';

// 터치 영역은 유지하고, 텍스트 박스에 맞게 보이는 핸들만 작게 표시합니다.
const HANDLE_TOUCH_SIZE = 44;
const ACTION_HANDLE_SIZE = 24;
const RESIZE_HANDLE_WIDTH = 18;
const RESIZE_HANDLE_HEIGHT = 28;
const DELETE_HANDLE_CORNER_OFFSET = 10;
const ROTATION_HANDLE_OFFSET = 28;

interface DiaryTextItemProps {
  textItem: DiaryText;
  editorSize: EditorSize;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onStartEditing: () => void;
  onChangeText: (value: string) => void;
  onChangeFrame: (frame: DiaryTextFrame) => void;
  onChangeHeight: (height: number) => void;
  onFinishEditing: () => void;
  onDelete: () => void;
}

function DiaryTextItem({
  textItem,
  editorSize,
  isSelected,
  isEditing,
  onSelect,
  onStartEditing,
  onChangeText,
  onChangeFrame,
  onChangeHeight,
  onFinishEditing,
  onDelete,
}: DiaryTextItemProps) {
  const textSelection = useRef({
    start: textItem.text.length,
    end: textItem.text.length,
  });

  const centerX = useSharedValue(textItem.centerX);

  const centerY = useSharedValue(textItem.centerY);

  const width = useSharedValue(textItem.width);

  const height = useSharedValue(textItem.height);

  const rotation = useSharedValue(textItem.rotation);

  const moveOffsetX = useSharedValue(0);

  const moveOffsetY = useSharedValue(0);

  const resizeStartFrame = useSharedValue<DiaryTextFrame>({
    centerX: textItem.centerX,
    centerY: textItem.centerY,
    width: textItem.width,
    height: textItem.height,
    rotation: textItem.rotation,
  });

  const rotationStartAngle = useSharedValue(0);

  const rotationStartValue = useSharedValue(0);

  useEffect(() => {
    centerX.value = textItem.centerX;
    centerY.value = textItem.centerY;
    width.value = textItem.width;
    rotation.value = textItem.rotation;
  }, [
    centerX,
    centerY,
    rotation,
    textItem.centerX,
    textItem.centerY,
    textItem.rotation,
    textItem.width,
    width,
  ]);

  const getCurrentFrame = (): DiaryTextFrame => {
    'worklet';

    return {
      centerX: centerX.value + moveOffsetX.value,
      centerY: centerY.value + moveOffsetY.value,
      width: width.value,
      height: height.value,
      rotation: rotation.value,
    };
  };

  const saveFrame = (nextFrame: DiaryTextFrame) => {
    onChangeFrame(nextFrame);
  };

  const commitCurrentFrame = () => {
    'worklet';

    const constrainedFrame = constrainDiaryTextFrame(
      getCurrentFrame(),
      editorSize,
    );

    centerX.value = constrainedFrame.centerX;

    centerY.value = constrainedFrame.centerY;

    width.value = constrainedFrame.width;

    height.value = constrainedFrame.height;

    rotation.value = constrainedFrame.rotation;

    moveOffsetX.value = 0;

    moveOffsetY.value = 0;

    scheduleOnRN(saveFrame, constrainedFrame);
  };

  const deleteGesture = useTapGesture({
    enabled: isSelected,

    onActivate: () => {
      scheduleOnRN(onDelete);
    },
  });

  const leftResizeGesture = usePanGesture({
    enabled: isSelected,

    onActivate: () => {
      resizeStartFrame.value = getCurrentFrame();
    },

    onUpdate: event => {
      const startFrame = resizeStartFrame.value;

      const cosine = Math.cos(startFrame.rotation);

      const sine = Math.sin(startFrame.rotation);

      const localTranslationX =
        event.translationX * cosine + event.translationY * sine;

      const maximumWidth = Math.max(MINIMUM_TEXT_WIDTH, editorSize.width - 24);

      const nextWidth = Math.min(
        maximumWidth,
        Math.max(MINIMUM_TEXT_WIDTH, startFrame.width - localTranslationX),
      );

      const widthDifference = nextWidth - startFrame.width;

      width.value = nextWidth;

      centerX.value = startFrame.centerX - cosine * (widthDifference / 2);

      centerY.value = startFrame.centerY - sine * (widthDifference / 2);
    },

    onDeactivate: commitCurrentFrame,
  });

  const rightResizeGesture = usePanGesture({
    enabled: isSelected,

    onActivate: () => {
      resizeStartFrame.value = getCurrentFrame();
    },

    onUpdate: event => {
      const startFrame = resizeStartFrame.value;

      const cosine = Math.cos(startFrame.rotation);

      const sine = Math.sin(startFrame.rotation);

      const localTranslationX =
        event.translationX * cosine + event.translationY * sine;

      const maximumWidth = Math.max(MINIMUM_TEXT_WIDTH, editorSize.width - 24);

      const nextWidth = Math.min(
        maximumWidth,
        Math.max(MINIMUM_TEXT_WIDTH, startFrame.width + localTranslationX),
      );

      const widthDifference = nextWidth - startFrame.width;

      width.value = nextWidth;

      centerX.value = startFrame.centerX + cosine * (widthDifference / 2);

      centerY.value = startFrame.centerY + sine * (widthDifference / 2);
    },

    onDeactivate: commitCurrentFrame,
  });

  const rotationGesture = usePanGesture({
    enabled: isSelected,

    onActivate: () => {
      const handleDistance = height.value / 2 + ROTATION_HANDLE_OFFSET;

      const handleAngle = rotation.value - Math.PI / 2;

      rotationStartAngle.value = Math.atan2(
        Math.sin(handleAngle) * handleDistance,
        Math.cos(handleAngle) * handleDistance,
      );

      rotationStartValue.value = rotation.value;
    },

    onUpdate: event => {
      const handleDistance = height.value / 2 + ROTATION_HANDLE_OFFSET;

      const startX = Math.cos(rotationStartAngle.value) * handleDistance;

      const startY = Math.sin(rotationStartAngle.value) * handleDistance;

      const currentAngle = Math.atan2(
        startY + event.translationY,
        startX + event.translationX,
      );

      let angleDifference = currentAngle - rotationStartAngle.value;

      if (angleDifference > Math.PI) {
        angleDifference -= Math.PI * 2;
      } else if (angleDifference < -Math.PI) {
        angleDifference += Math.PI * 2;
      }

      rotation.value = rotationStartValue.value + angleDifference;
    },

    onDeactivate: commitCurrentFrame,
  });

  const handleGestures = [
    deleteGesture,
    leftResizeGesture,
    rightResizeGesture,
    rotationGesture,
  ];

  const tapGesture = useTapGesture({
    enabled: !isEditing,
    requireToFail: handleGestures,

    onActivate: () => {
      if (isSelected) {
        scheduleOnRN(onStartEditing);
      } else {
        scheduleOnRN(onSelect);
      }
    },
  });

  const moveGesture = usePanGesture({
    // 새 텍스트가 비어 있을 때는 입력 포커스를 유지한 채 위치를 옮길 수 있습니다.
    enabled: !isEditing || textItem.text.length === 0,
    averageTouches: true,
    // 텍스트를 누른 채 조금만 움직여도 탭이 아닌 이동으로 인식합니다.
    minDistance: 2,
    requireToFail: handleGestures,

    onActivate: () => {
      if (!isSelected) {
        scheduleOnRN(onSelect);
      }
    },

    onUpdate: event => {
      moveOffsetX.value += event.changeX;

      moveOffsetY.value += event.changeY;
    },

    onDeactivate: commitCurrentFrame,
  });

  // 드래그를 우선 판정해 이동하려는 동작이 재편집 탭으로 처리되지 않게 합니다.
  const itemGesture = useExclusiveGestures(moveGesture, tapGesture);

  const displayFrame = useDerivedValue(() =>
    constrainDiaryTextFrame(
      {
        centerX: centerX.value + moveOffsetX.value,
        centerY: centerY.value + moveOffsetY.value,
        width: width.value,
        height: height.value,
        rotation: rotation.value,
      },
      editorSize,
    ),
  );

  const textBoxAnimatedStyle = useAnimatedStyle(() => {
    const frame = displayFrame.value;

    return {
      width: frame.width,
      height: frame.height,
      transform: [
        {
          translateX: frame.centerX - frame.width / 2,
        },
        {
          translateY: frame.centerY - frame.height / 2,
        },
        {
          rotateZ: `${frame.rotation}rad`,
        },
      ],
    };
  });

  const deleteHandleStyle = useAnimatedStyle(() => {
    const frame = displayFrame.value;

    const point = getDiaryTextPoint(
      frame,
      -DELETE_HANDLE_CORNER_OFFSET,
      -DELETE_HANDLE_CORNER_OFFSET,
    );

    return {
      transform: [
        {
          translateX: point.x - HANDLE_TOUCH_SIZE / 2,
        },
        {
          translateY: point.y - HANDLE_TOUCH_SIZE / 2,
        },
        {
          rotateZ: `${frame.rotation}rad`,
        },
      ],
    };
  });

  const leftHandleStyle = useAnimatedStyle(() => {
    const frame = displayFrame.value;

    const point = getDiaryTextPoint(frame, 0, frame.height / 2);

    return {
      transform: [
        {
          translateX: point.x - HANDLE_TOUCH_SIZE / 2,
        },
        {
          translateY: point.y - HANDLE_TOUCH_SIZE / 2,
        },
        {
          rotateZ: `${frame.rotation}rad`,
        },
      ],
    };
  });

  const rightHandleStyle = useAnimatedStyle(() => {
    const frame = displayFrame.value;

    const point = getDiaryTextPoint(frame, frame.width, frame.height / 2);

    return {
      transform: [
        {
          translateX: point.x - HANDLE_TOUCH_SIZE / 2,
        },
        {
          translateY: point.y - HANDLE_TOUCH_SIZE / 2,
        },
        {
          rotateZ: `${frame.rotation}rad`,
        },
      ],
    };
  });

  const rotationHandleStyle = useAnimatedStyle(() => {
    const frame = displayFrame.value;

    const topCenter = getDiaryTextPoint(frame, frame.width / 2, 0);

    const point = {
      x: topCenter.x + Math.sin(frame.rotation) * ROTATION_HANDLE_OFFSET,
      y: topCenter.y - Math.cos(frame.rotation) * ROTATION_HANDLE_OFFSET,
    };

    return {
      transform: [
        {
          translateX: point.x - HANDLE_TOUCH_SIZE / 2,
        },
        {
          translateY: point.y - HANDLE_TOUCH_SIZE / 2,
        },
        {
          rotateZ: `${frame.rotation}rad`,
        },
      ],
    };
  });

  const rotationConnectorStyle = useAnimatedStyle(() => {
    const frame = displayFrame.value;

    const topCenter = getDiaryTextPoint(frame, frame.width / 2, 0);

    const middleX =
      topCenter.x + (Math.sin(frame.rotation) * ROTATION_HANDLE_OFFSET) / 2;

    const middleY =
      topCenter.y - (Math.cos(frame.rotation) * ROTATION_HANDLE_OFFSET) / 2;

    return {
      transform: [
        {
          translateX: middleX - 0.5,
        },
        {
          translateY: middleY - ROTATION_HANDLE_OFFSET / 2,
        },
        {
          rotateZ: `${frame.rotation}rad`,
        },
      ],
    };
  });

  const lineHeight = Math.round(textItem.style.fontSize * 1.3);

  const textDecorationLine = textItem.style.hasUnderline
    ? textItem.style.hasStrikeThrough
      ? 'underline line-through'
      : 'underline'
    : textItem.style.hasStrikeThrough
    ? 'line-through'
    : 'none';

  const fontFamily = textItem.style.isBold ? fonts.bold : fonts.regular;

  const textInputStyleKey = [
    textItem.style.color,
    textItem.style.fontSize,
    textItem.style.align,
    fontFamily,
    textDecorationLine,
  ].join(':');

  const latestTextInputStyleKey = useRef(textInputStyleKey);
  latestTextInputStyleKey.current = textInputStyleKey;

  const commonTextStyle = {
    color: textItem.style.color,
    fontSize: textItem.style.fontSize,
    lineHeight,
    textAlign: textItem.style.align,
    textDecorationLine,
    fontFamily,
  } as const;

  /**
   * 실제 입력 내용과 텍스트 박스 높이를 같은 값으로 맞춥니다.
   */
  const updateTextBoxHeight = (contentHeight: number) => {
    const nextHeight = Math.max(MINIMUM_TEXT_HEIGHT, contentHeight);

    if (Math.abs(height.value - nextHeight) < 1) {
      return;
    }

    height.value = nextHeight;
    onChangeHeight(nextHeight);
  };

  /**
   * TextInput이 알려주는 실제 콘텐츠 높이를 사용합니다.
   * 마지막 문자가 줄바꿈이면 숨은 측정 Text가 빈 줄까지 계산합니다.
   */
  const handleTextInputContentSizeChange = ({
    nativeEvent,
  }: TextInputContentSizeChangeEvent) => {
    if (textItem.text.endsWith('\n')) {
      return;
    }

    updateTextBoxHeight(nativeEvent.contentSize.height);
  };

  /**
   * TextInput이 놓치는 마지막 빈 줄의 높이를 보완합니다.
   */
  const handleTextMeasureLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    if (!textItem.text.endsWith('\n')) {
      return;
    }

    updateTextBoxHeight(nativeEvent.layout.height);
  };

  /**
   * 스타일 변경으로 입력창이 다시 만들어져도 커서와 선택 범위를 유지합니다.
   */
  const handleTextSelectionChange = ({
    nativeEvent,
  }: TextInputSelectionChangeEvent) => {
    textSelection.current = nativeEvent.selection;
  };

  /**
   * 스타일 변경으로 교체된 이전 입력창의 blur는 편집 완료로 처리하지 않습니다.
   */
  const handleTextInputBlur = () => {
    if (textInputStyleKey !== latestTextInputStyleKey.current) {
      return;
    }

    onFinishEditing();
  };

  const content = (
    <Animated.View style={[styles.textBox, textBoxAnimatedStyle]}>
      {isEditing ? (
        <>
          <Text
            accessible={false}
            pointerEvents="none"
            onLayout={handleTextMeasureLayout}
            style={[styles.text, commonTextStyle, styles.textMeasure]}
          >
            {`${textItem.text}\u200B`}
          </Text>

          <TextInput
            key={textInputStyleKey}
            autoFocus
            multiline
            scrollEnabled={false}
            defaultValue={textItem.text}
            selection={textSelection.current}
            textAlign={textItem.style.align}
            placeholder="텍스트 입력"
            placeholderTextColor={colors.textPlaceholder}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            onChangeText={onChangeText}
            onContentSizeChange={handleTextInputContentSizeChange}
            onSelectionChange={handleTextSelectionChange}
            onBlur={handleTextInputBlur}
            style={[styles.text, styles.textInput, commonTextStyle]}
          />
        </>
      ) : (
        <Text
          accessible
          accessibilityLabel={`다이어리 텍스트 ${textItem.text}`}
          accessibilityState={{
            selected: isSelected,
          }}
          style={[styles.text, commonTextStyle]}
        >
          {textItem.text}
        </Text>
      )}

      {isSelected ? (
        <View pointerEvents="none" style={styles.selectionBorder} />
      ) : null}
    </Animated.View>
  );

  return (
    <>
      <GestureDetector gesture={itemGesture}>{content}</GestureDetector>

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
              accessibilityLabel="텍스트 삭제"
              onAccessibilityTap={onDelete}
              style={[styles.handleTouchArea, deleteHandleStyle]}
            >
              <View
                style={[
                  styles.handleButton,
                  styles.actionHandle,
                  styles.deleteButton,
                ]}
              >
                <X size={12} color="#D92D20" strokeWidth={2} />
              </View>
            </Animated.View>
          </GestureDetector>

          <GestureDetector gesture={leftResizeGesture}>
            <Animated.View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="텍스트 왼쪽 너비 조절"
              style={[styles.handleTouchArea, leftHandleStyle]}
            >
              <View style={[styles.handleButton, styles.resizeButton]}>
                <MoveHorizontal
                  size={12}
                  color={colors.onPrimary}
                  strokeWidth={2}
                />
              </View>
            </Animated.View>
          </GestureDetector>

          <GestureDetector gesture={rightResizeGesture}>
            <Animated.View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="텍스트 오른쪽 너비 조절"
              style={[styles.handleTouchArea, rightHandleStyle]}
            >
              <View style={[styles.handleButton, styles.resizeButton]}>
                <MoveHorizontal
                  size={12}
                  color={colors.onPrimary}
                  strokeWidth={2}
                />
              </View>
            </Animated.View>
          </GestureDetector>

          <GestureDetector gesture={rotationGesture}>
            <Animated.View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="텍스트 회전"
              style={[styles.handleTouchArea, rotationHandleStyle]}
            >
              <View style={[styles.handleButton, styles.actionHandle]}>
                <RotateCw size={12} color={colors.primary} strokeWidth={2} />
              </View>
            </Animated.View>
          </GestureDetector>
        </>
      ) : null}
    </>
  );
}

export default DiaryTextItem;

const styles = StyleSheet.create({
  textBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    minHeight: MINIMUM_TEXT_HEIGHT,
    overflow: 'hidden',
  },

  text: {
    width: '100%',
    minHeight: MINIMUM_TEXT_HEIGHT,
    paddingHorizontal: 10,
    paddingVertical: 7,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  textMeasure: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
  },

  textInput: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
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
    width: HANDLE_TOUCH_SIZE,
    height: HANDLE_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  handleButton: {
    borderRadius: 7,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: '0 2px 8px rgba(24, 27, 32, 0.14)',
  },

  actionHandle: {
    width: ACTION_HANDLE_SIZE,
    height: ACTION_HANDLE_SIZE,
  },

  deleteButton: {
    borderColor: '#F2C8C4',
    backgroundColor: '#FFF7F6',
  },

  resizeButton: {
    width: RESIZE_HANDLE_WIDTH,
    height: RESIZE_HANDLE_HEIGHT,
    borderRadius: 6,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
