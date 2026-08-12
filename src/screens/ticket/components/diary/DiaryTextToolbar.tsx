import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Minus,
  Plus,
  Strikethrough,
  Underline,
} from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import ColorPicker, {
  HueSlider,
  Panel1,
  Preview,
} from 'reanimated-color-picker';
import AppButton from '../../../../components/common/AppButton.tsx';
import AppBottomSheet from '../../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../../components/common/AppText.tsx';
import { colors } from '../../../../styles/colors.ts';
import { type DiaryText, type DiaryTextStyle } from './diaryText.ts';

const MINIMUM_FONT_SIZE = 12;
const MAXIMUM_FONT_SIZE = 72;
const FONT_SIZE_STEP = 2;

interface DiaryTextToolbarProps {
  textItem: DiaryText;
  onChangeStyle: (patch: Partial<DiaryTextStyle>) => void;
}

function DiaryTextToolbar({ textItem, onChangeStyle }: DiaryTextToolbarProps) {
  const [isColorPickerVisible, setColorPickerVisible] = useState(false);
  const [colorBeforePicker, setColorBeforePicker] = useState(
    textItem.style.color,
  );

  /**
   * 색상 피커를 열고, 취소 시 복구할 현재 색상을 저장합니다.
   */
  const openColorPicker = () => {
    const currentColor = textItem.style.color;

    setColorBeforePicker(currentColor);
    Keyboard.dismiss();
    setColorPickerVisible(true);
  };

  /**
   * 색상 변경을 취소하고 피커를 열기 전 색상으로 되돌립니다.
   */
  const cancelColorPicker = () => {
    onChangeStyle({
      color: colorBeforePicker,
    });
    setColorPickerVisible(false);
  };

  /**
   * 글자 크기를 최소·최대 범위 안에서 변경합니다.
   */
  const changeFontSize = (amount: number) => {
    const nextFontSize = Math.min(
      MAXIMUM_FONT_SIZE,
      Math.max(MINIMUM_FONT_SIZE, textItem.style.fontSize + amount),
    );

    onChangeStyle({
      fontSize: nextFontSize,
    });
  };

  const isMinimumFontSize = textItem.style.fontSize <= MINIMUM_FONT_SIZE;
  const isMaximumFontSize = textItem.style.fontSize >= MAXIMUM_FONT_SIZE;

  return (
    <>
      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.toolbarContent}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="텍스트 색상 변경"
            accessibilityHint="색상 선택창을 엽니다"
            onPress={openColorPicker}
            style={({ pressed }) => [
              styles.colorButton,
              pressed && styles.pressedControl,
            ]}
          >
            <View style={styles.colorSwatchRing}>
              <View
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: textItem.style.color,
                  },
                ]}
              />
            </View>
          </Pressable>

          <View style={styles.controlGroup}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="글자 크기 줄이기"
              disabled={isMinimumFontSize}
              onPress={() => changeFontSize(-FONT_SIZE_STEP)}
              style={({ pressed }) => [
                styles.sizeButton,
                pressed && styles.pressedControl,
              ]}
            >
              <Minus
                size={17}
                strokeWidth={2}
                color={
                  isMinimumFontSize ? colors.disabled : colors.textSecondary
                }
              />
            </Pressable>

            <View style={styles.fontSizeDisplay}>
              <AppText size={13} weight="semiBold" align="center">
                {textItem.style.fontSize}
              </AppText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="글자 크기 늘리기"
              disabled={isMaximumFontSize}
              onPress={() => changeFontSize(FONT_SIZE_STEP)}
              style={({ pressed }) => [
                styles.sizeButton,
                pressed && styles.pressedControl,
              ]}
            >
              <Plus
                size={17}
                strokeWidth={2}
                color={
                  isMaximumFontSize ? colors.disabled : colors.textSecondary
                }
              />
            </Pressable>
          </View>

          <View style={styles.controlGroup}>
            <SegmentButton
              label="왼쪽 정렬"
              isSelected={textItem.style.align === 'left'}
              onPress={() => onChangeStyle({ align: 'left' })}
            >
              <AlignLeft
                size={18}
                strokeWidth={2}
                color={
                  textItem.style.align === 'left'
                    ? colors.primary
                    : colors.textSecondary
                }
              />
            </SegmentButton>

            <SegmentButton
              label="가운데 정렬"
              isSelected={textItem.style.align === 'center'}
              onPress={() => onChangeStyle({ align: 'center' })}
            >
              <AlignCenter
                size={18}
                strokeWidth={2}
                color={
                  textItem.style.align === 'center'
                    ? colors.primary
                    : colors.textSecondary
                }
              />
            </SegmentButton>

            <SegmentButton
              label="오른쪽 정렬"
              isSelected={textItem.style.align === 'right'}
              onPress={() => onChangeStyle({ align: 'right' })}
            >
              <AlignRight
                size={18}
                strokeWidth={2}
                color={
                  textItem.style.align === 'right'
                    ? colors.primary
                    : colors.textSecondary
                }
              />
            </SegmentButton>
          </View>

          <View style={styles.controlGroup}>
            <SegmentButton
              label="굵게"
              isSelected={textItem.style.isBold}
              onPress={() =>
                onChangeStyle({
                  isBold: !textItem.style.isBold,
                })
              }
            >
              <Bold
                size={18}
                strokeWidth={2.2}
                color={
                  textItem.style.isBold ? colors.primary : colors.textSecondary
                }
              />
            </SegmentButton>

            <SegmentButton
              label="밑줄"
              isSelected={textItem.style.hasUnderline}
              onPress={() =>
                onChangeStyle({
                  hasUnderline: !textItem.style.hasUnderline,
                })
              }
            >
              <Underline
                size={18}
                strokeWidth={2}
                color={
                  textItem.style.hasUnderline
                    ? colors.primary
                    : colors.textSecondary
                }
              />
            </SegmentButton>

            <SegmentButton
              label="취소선"
              isSelected={textItem.style.hasStrikeThrough}
              onPress={() =>
                onChangeStyle({
                  hasStrikeThrough: !textItem.style.hasStrikeThrough,
                })
              }
            >
              <Strikethrough
                size={18}
                strokeWidth={2}
                color={
                  textItem.style.hasStrikeThrough
                    ? colors.primary
                    : colors.textSecondary
                }
              />
            </SegmentButton>
          </View>
        </ScrollView>
      </View>

      <AppBottomSheet
        visible={isColorPickerVisible}
        title="텍스트 색상"
        onClose={cancelColorPicker}
        closeAccessibilityLabel="텍스트 색상 선택 닫기"
        headerRight={
          <View style={styles.sheetHeaderActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="색상 선택 취소"
              onPress={cancelColorPicker}
              style={({ pressed }) => [
                styles.headerTextButton,
                pressed && styles.pressedControl,
              ]}
            >
              <AppText size={14} color={colors.textSecondary}>
                취소
              </AppText>
            </Pressable>

            <AppButton
              accessibilityRole="button"
              accessibilityLabel="색상 적용"
              onPress={() => setColorPickerVisible(false)}
              style={({ pressed }) => [
                styles.doneButton,
                pressed && styles.pressedDoneButton,
              ]}
            >
              <AppText size={13} weight="semiBold" color={colors.onPrimary}>
                완료
              </AppText>
            </AppButton>
          </View>
        }
      >
        <ColorPicker
          key={colorBeforePicker}
          value={colorBeforePicker}
          boundedThumb
          thumbSize={28}
          onCompleteJS={result => {
            // 손을 뗄 때 선택된 텍스트에도 미리 반영합니다.
            onChangeStyle({
              color: result.hex,
            });
          }}
          style={styles.colorPicker}
        >
          <Preview
            hideInitialColor
            colorFormat="hex"
            style={styles.colorPreview}
          />

          <Panel1 style={styles.colorPanel} />

          <HueSlider style={styles.hueSlider} />
        </ColorPicker>
      </AppBottomSheet>
    </>
  );
}

interface SegmentButtonProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  children: ReactNode;
}

function SegmentButton({
  label,
  isSelected,
  onPress,
  children,
}: SegmentButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        selected: isSelected,
      }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        isSelected && styles.selectedSegmentButton,
        pressed && styles.pressedControl,
      ]}
    >
      {children}
    </Pressable>
  );
}

export default DiaryTextToolbar;

const styles = StyleSheet.create({
  toolbar: {
    height: 68,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  toolbarContent: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  colorButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: colors.background,
  },

  colorSwatchRing: {
    width: 28,
    height: 28,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  colorSwatch: {
    flex: 1,
    borderRadius: 11,
  },

  controlGroup: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: colors.background,
  },

  sizeButton: {
    width: 38,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fontSizeDisplay: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },

  segmentButton: {
    width: 42,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedSegmentButton: {
    backgroundColor: colors.primarySoft,
  },

  pressedControl: {
    opacity: 0.55,
  },

  sheetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  headerTextButton: {
    minWidth: 60,
    height: 44,
    justifyContent: 'center',
  },

  doneButton: {
    minWidth: 60,
    height: 36,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },

  pressedDoneButton: {
    backgroundColor: colors.primaryPressed,
  },

  colorPicker: {
    gap: 18,
    paddingBottom: 8,
  },

  colorPreview: {
    height: 46,
    borderRadius: 12,
    borderCurve: 'continuous',
  },

  colorPanel: {
    height: 220,
    borderRadius: 14,
    borderCurve: 'continuous',
  },

  hueSlider: {
    height: 28,
    marginBottom: 8,
    borderRadius: 14,
  },
});
