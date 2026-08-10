import {
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  TextInput,
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
  getDisplayedDiaryTextPoint,
  MINIMUM_TEXT_HEIGHT,
  MINIMUM_TEXT_WIDTH,
} from './diaryText.ts';
import { type EditorSize, snapRotationToZero } from './photoTransform.ts';

const HANDLE_TOUCH_SIZE = 44;
const ACTION_HANDLE_SIZE = 24;
const RESIZE_HANDLE_WIDTH = 18;
const RESIZE_HANDLE_HEIGHT = 28;

interface DiaryTextItemProps {
  textItem: DiaryText;
  editorSize: EditorSize;
  displayScale: number;
  displayScaleY: number;
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
  displayScale,
  displayScaleY,
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
  const safeDisplayScale = Math.max(displayScale, 0.0001);
  const safeDisplayScaleY = Math.max(displayScaleY, 0.0001);
  const verticalScaleRatio = Math.min(1, safeDisplayScale / safeDisplayScaleY);
  const textInputRef = useRef<TextInput>(null);

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
      verticalScaleRatio,
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
        (event.translationX / safeDisplayScale) * cosine +
        (event.translationY / safeDisplayScale) * sine;

      const maximumWidth = Math.max(MINIMUM_TEXT_WIDTH, editorSize.width - 24);

      const nextWidth = Math.min(
        maximumWidth,
        Math.max(MINIMUM_TEXT_WIDTH, startFrame.width - localTranslationX),
      );

      const widthDifference = nextWidth - startFrame.width;

      width.value = nextWidth;

      centerX.value = startFrame.centerX - cosine * (widthDifference / 2);

      centerY.value =
        startFrame.centerY - sine * (widthDifference / 2) * verticalScaleRatio;
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
        (event.translationX / safeDisplayScale) * cosine +
        (event.translationY / safeDisplayScale) * sine;

      const maximumWidth = Math.max(MINIMUM_TEXT_WIDTH, editorSize.width - 24);

      const nextWidth = Math.min(
        maximumWidth,
        Math.max(MINIMUM_TEXT_WIDTH, startFrame.width + localTranslationX),
      );

      const widthDifference = nextWidth - startFrame.width;

      width.value = nextWidth;

      centerX.value = startFrame.centerX + cosine * (widthDifference / 2);

      centerY.value =
        startFrame.centerY + sine * (widthDifference / 2) * verticalScaleRatio;
    },

    onDeactivate: commitCurrentFrame,
  });

  const rotationGesture = usePanGesture({
    enabled: isSelected,

    onActivate: () => {
      const handleDistance = height.value / 2;

      const handleAngle = rotation.value - Math.PI / 2;

      rotationStartAngle.value = Math.atan2(
        Math.sin(handleAngle) * handleDistance,
        Math.cos(handleAngle) * handleDistance,
      );

      rotationStartValue.value = rotation.value;
    },

    onUpdate: event => {
      const handleDistance = height.value / 2;

      const startX = Math.cos(rotationStartAngle.value) * handleDistance;

      const startY = Math.sin(rotationStartAngle.value) * handleDistance;

      const currentAngle = Math.atan2(
        startY + event.translationY / safeDisplayScale,
        startX + event.translationX / safeDisplayScale,
      );

      let angleDifference = currentAngle - rotationStartAngle.value;

      if (angleDifference > Math.PI) {
        angleDifference -= Math.PI * 2;
      } else if (angleDifference < -Math.PI) {
        angleDifference += Math.PI * 2;
      }

      rotation.value = snapRotationToZero(
        rotationStartValue.value + angleDifference,
      );
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
    enabled: !isEditing || textItem.text.length === 0,
    averageTouches: true,
    minDistance: 2,
    requireToFail: handleGestures,

    onActivate: () => {
      if (!isSelected) {
        scheduleOnRN(onSelect);
      }
    },

    onUpdate: event => {
      moveOffsetX.value += event.changeX / safeDisplayScale;

      moveOffsetY.value += event.changeY / safeDisplayScaleY;
    },

    onDeactivate: commitCurrentFrame,
  });

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
      verticalScaleRatio,
    ),
  );

  const textBoxAnimatedStyle = useAnimatedStyle(() => {
    const frame = displayFrame.value;

    return {
      transform: [
        {
          translateX: (frame.centerX - frame.width / 2) * safeDisplayScale,
        },
        {
          translateY: (frame.centerY - frame.height / 2) * safeDisplayScaleY,
        },
        {
          rotateZ: `${frame.rotation}rad`,
        },
      ],
      width: frame.width * safeDisplayScale,
      height: frame.height * safeDisplayScale,
    };
  });

  const deleteHandleStyle = useAnimatedStyle(() => {
    const frame = displayFrame.value;

    const point = getDisplayedDiaryTextPoint(
      frame,
      0,
      0,
      safeDisplayScale,
      safeDisplayScaleY,
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

    const point = getDisplayedDiaryTextPoint(
      frame,
      0,
      frame.height,
      safeDisplayScale,
      safeDisplayScaleY,
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

  const rightHandleStyle = useAnimatedStyle(() => {
    const frame = displayFrame.value;

    const point = getDisplayedDiaryTextPoint(
      frame,
      frame.width,
      frame.height,
      safeDisplayScale,
      safeDisplayScaleY,
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

  const rotationHandleStyle = useAnimatedStyle(() => {
    const frame = displayFrame.value;

    const point = getDisplayedDiaryTextPoint(
      frame,
      frame.width / 2,
      0,
      safeDisplayScale,
      safeDisplayScaleY,
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

  useEffect(() => {
    if (!isEditing) return;

    const frameId = requestAnimationFrame(() => {
      const { start, end } = textSelection.current;
      textInputRef.current?.setSelection(start, end);
    });

    return () => cancelAnimationFrame(frameId);
  }, [isEditing, textInputStyleKey]);

  const commonTextStyle = {
    color: textItem.style.color,
    fontSize: textItem.style.fontSize * safeDisplayScale,
    lineHeight: lineHeight * safeDisplayScale,
    minHeight: MINIMUM_TEXT_HEIGHT * safeDisplayScale,
    paddingHorizontal: 10 * safeDisplayScale,
    paddingVertical: 7 * safeDisplayScale,
    textAlign: textItem.style.align,
    textDecorationLine,
    fontFamily,
  } as const;

  const updateTextBoxHeight = (contentHeight: number) => {
    const nextHeight = Math.max(MINIMUM_TEXT_HEIGHT, contentHeight);

    if (Math.abs(height.value - nextHeight) < 1) {
      return;
    }

    height.value = nextHeight;
    onChangeHeight(nextHeight);
  };

  const handleTextMeasureLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    updateTextBoxHeight(nativeEvent.layout.height / safeDisplayScale);
  };

  const handleTextSelectionChange = ({
    nativeEvent,
  }: TextInputSelectionChangeEvent) => {
    textSelection.current = nativeEvent.selection;
  };

  const handleTextInputBlur = () => {
    if (textInputStyleKey !== latestTextInputStyleKey.current) {
      return;
    }

    onFinishEditing();
  };

  const content = (
    <Animated.View style={[styles.textBox, textBoxAnimatedStyle]}>
      <Text
        accessible={false}
        pointerEvents="none"
        onLayout={handleTextMeasureLayout}
        style={[styles.text, commonTextStyle, styles.textMeasure]}
      >
        {`${textItem.text}\u200B`}
      </Text>

      {isEditing ? (
        <TextInput
          key={textInputStyleKey}
          ref={textInputRef}
          autoFocus
          multiline
          scrollEnabled={false}
          defaultValue={textItem.text}
          textAlign={textItem.style.align}
          placeholder="텍스트 입력"
          placeholderTextColor={colors.textPlaceholder}
          selectionColor={colors.accentBlue}
          cursorColor={colors.accentBlue}
          onChangeText={onChangeText}
          onSelectionChange={handleTextSelectionChange}
          onBlur={handleTextInputBlur}
          style={[styles.text, styles.textInput, commonTextStyle]}
        />
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
          <GestureDetector gesture={deleteGesture}>
            <Animated.View
              accessible
              accessibilityRole="button"
              accessibilityLabel="텍스트 삭제"
              onAccessibilityTap={onDelete}
              style={[styles.handleTouchArea, deleteHandleStyle]}
            >
              <View style={[styles.handleButton, styles.actionHandle]}>
                <X size={12} color={colors.accentBlue} strokeWidth={2} />
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
                  color={colors.accentBlue}
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
                  color={colors.accentBlue}
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
                <RotateCw size={12} color={colors.accentBlue} strokeWidth={2} />
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
    borderColor: colors.accentBlue,
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
    borderColor: colors.accentBlueBorder,
    backgroundColor: colors.surface,
    boxShadow: '0 2px 8px rgba(24, 27, 32, 0.14)',
  },

  actionHandle: {
    width: ACTION_HANDLE_SIZE,
    height: ACTION_HANDLE_SIZE,
  },

  resizeButton: {
    width: RESIZE_HANDLE_WIDTH,
    height: RESIZE_HANDLE_HEIGHT,
    borderRadius: 6,
  },
});
