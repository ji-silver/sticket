import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  GripVertical,
  ImageIcon,
  Layers,
  Pencil,
  Sticker,
  Type,
  X,
} from 'lucide-react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import AppText from '../../../../components/common/AppText.tsx';
import { colors } from '../../../../styles/colors.ts';

const PANEL_HORIZONTAL_INSET = 12;
const PANEL_TOP_INSET = 12;
const PANEL_WIDTH = 104;
const PANEL_HEADER_HEIGHT = 52;
const LAYER_ROW_HEIGHT = 58;

export interface DiaryLayerPanelItem {
  id: string;
  type: 'photo' | 'sticker' | 'text' | 'drawing';
  label: string;
  imageSource?: ImageSourcePropType;
}

interface DiaryLayerPanelProps {
  placement: 'overlay' | 'side';
  items: DiaryLayerPanelItem[];
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, targetIndex: number) => void;
  onClose: () => void;
}

interface DiaryLayerRowProps {
  item: DiaryLayerPanelItem;
  index: number;
  itemCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (targetIndex: number) => void;
}

function DiaryLayerRow({
  item,
  index,
  itemCount,
  isSelected,
  onSelect,
  onMove,
}: DiaryLayerRowProps) {
  const translationY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const dragGesture = usePanGesture({
    activateAfterLongPress: 400,
    onActivate: () => {
      isDragging.value = true;
      scheduleOnRN(onSelect);
    },
    onUpdate: event => {
      const minimumY = -index * LAYER_ROW_HEIGHT;
      const maximumY = (itemCount - index - 1) * LAYER_ROW_HEIGHT;

      translationY.value = Math.min(
        maximumY,
        Math.max(minimumY, event.translationY),
      );
    },
    onDeactivate: event => {
      const targetIndex = Math.min(
        itemCount - 1,
        Math.max(0, index + Math.round(event.translationY / LAYER_ROW_HEIGHT)),
      );

      translationY.value = withTiming(0, { duration: 120 });
      isDragging.value = false;

      if (targetIndex !== index) {
        scheduleOnRN(onMove, targetIndex);
      }
    },
    onFinalize: () => {
      translationY.value = withTiming(0, { duration: 120 });
      isDragging.value = false;
    },
  });

  const animatedRowStyle = useAnimatedStyle(() => ({
    zIndex: isDragging.value ? 2 : 0,
    opacity: isDragging.value ? 0.92 : 1,
    transform: [
      { translateY: translationY.value },
      { scale: withTiming(isDragging.value ? 1.02 : 1, { duration: 120 }) },
    ],
  }));

  const PreviewIcon =
    item.type === 'text'
      ? Type
      : item.type === 'drawing'
      ? Pencil
      : item.type === 'sticker'
      ? Sticker
      : ImageIcon;

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View
        style={[
          styles.layerRow,
          isSelected && styles.selectedLayerRow,
          animatedRowStyle,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.label} 레이어 선택`}
          accessibilityState={{ selected: isSelected }}
          onPress={onSelect}
          style={({ pressed }) => [
            styles.layerContent,
            pressed && styles.pressedLayerContent,
          ]}
        >
          <View style={styles.preview}>
            {item.imageSource ? (
              <Image
                source={item.imageSource}
                resizeMode="cover"
                style={styles.image}
              />
            ) : (
              <PreviewIcon
                size={18}
                strokeWidth={2}
                color={isSelected ? colors.primary : colors.textSecondary}
              />
            )}
          </View>
        </Pressable>

        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`${item.label} 레이어 순서`}
          accessibilityActions={[
            { name: 'increment', label: '앞으로 이동' },
            { name: 'decrement', label: '뒤로 이동' },
          ]}
          onAccessibilityAction={event => {
            if (event.nativeEvent.actionName === 'increment' && index > 0) {
              onMove(index - 1);
            }

            if (
              event.nativeEvent.actionName === 'decrement' &&
              index < itemCount - 1
            ) {
              onMove(index + 1);
            }
          }}
          style={styles.dragHandle}
        >
          <GripVertical
            size={20}
            color={colors.textSecondary}
            strokeWidth={2}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function DiaryLayerPanel({
  placement,
  items,
  selectedLayerId,
  onSelectLayer,
  onMoveLayer,
  onClose,
}: DiaryLayerPanelProps) {
  const isOverlay = placement === 'overlay';

  return (
    <View
      style={[
        styles.panel,
        isOverlay ? styles.overlayPanel : styles.sidePanel,
        isOverlay && styles.panelTransformOrigin,
      ]}
    >
      <View style={styles.header}>
        <View
          accessible
          accessibilityLabel={`레이어 ${items.length}개`}
          style={styles.headerTitle}
        >
          <Layers size={15} color={colors.primary} strokeWidth={2.2} />
          <AppText size={13} weight="semiBold">
            레이어
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="레이어 패널 닫기"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressedCloseButton,
          ]}
        >
          <X size={19} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      {items.length > 0 ? (
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={styles.layerList}
        >
          {items.map((item, index) => (
            <DiaryLayerRow
              key={item.id}
              item={item}
              index={index}
              itemCount={items.length}
              isSelected={selectedLayerId === item.id}
              onSelect={() => onSelectLayer(item.id)}
              onMove={targetIndex => onMoveLayer(item.id, targetIndex)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

export default DiaryLayerPanel;

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: PANEL_TOP_INSET,
    bottom: PANEL_TOP_INSET,
    width: PANEL_WIDTH,
    zIndex: 50,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },

  overlayPanel: {
    right: PANEL_HORIZONTAL_INSET,
  },

  sidePanel: {
    right: 24,
  },

  panelTransformOrigin: {
    transformOrigin: 'top right',
  },

  header: {
    height: PANEL_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
    paddingRight: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.primary50,
  },

  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  closeButton: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderCurve: 'continuous',
  },

  pressedCloseButton: {
    backgroundColor: colors.primarySoft,
  },

  layerRow: {
    height: LAYER_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },

  selectedLayerRow: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.primary50,
  },

  layerContent: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
  },

  pressedLayerContent: {
    opacity: 0.65,
  },

  preview: {
    width: 36,
    height: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderCurve: 'continuous',
    backgroundColor: colors.background,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  layerList: {
    flex: 1,
  },

  dragHandle: {
    width: 34,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
