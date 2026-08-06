import { Pressable, StyleSheet, View } from 'react-native';
import {
  ImagePlus,
  Layers,
  Notebook,
  Pencil,
  Sticker,
  Type,
} from 'lucide-react-native';
import AppText from '../../../../components/common/AppText.tsx';
import { colors } from '../../../../styles/colors.ts';

const DIARY_TOOLS = [
  {
    id: 'paper',
    label: '속지',
    icon: Notebook,
  },
  {
    id: 'photo',
    label: '사진',
    icon: ImagePlus,
  },
  {
    id: 'sticker',
    label: '스티커',
    icon: Sticker,
  },
  {
    id: 'drawing',
    label: '드로잉',
    icon: Pencil,
  },
  {
    id: 'text',
    label: '텍스트',
    icon: Type,
  },
  {
    id: 'layers',
    label: '레이어',
    icon: Layers,
  },
] as const;

export type DiaryToolId = (typeof DIARY_TOOLS)[number]['id'];

interface DiaryBottomToolbarProps {
  selectedTool: DiaryToolId | null;
  onPressTool: (toolId: DiaryToolId) => void;
}

function DiaryBottomToolbar({
  selectedTool,
  onPressTool,
}: DiaryBottomToolbarProps) {
  return (
    <View style={styles.toolbar}>
      <View style={styles.toolbarContent}>
        {DIARY_TOOLS.map(tool => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          return (
            <Pressable
              key={tool.id}
              accessibilityRole="button"
              accessibilityLabel={`${tool.label} 도구`}
              onPress={() => onPressTool(tool.id)}
              style={({ pressed }) => [
                styles.toolButton,
                pressed && styles.pressedToolButton,
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  isSelected && styles.selectedIconContainer,
                ]}
              >
                <Icon
                  size={22}
                  strokeWidth={2}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
              </View>

              <AppText
                size={12}
                weight={isSelected ? 'semiBold' : 'regular'}
                color={isSelected ? colors.primary : colors.textSecondary}
              >
                {tool.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default DiaryBottomToolbar;

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    height: 72,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  toolbarContent: {
    width: '100%',
    maxWidth: 393,
    alignSelf: 'center',
    flexDirection: 'row',
  },

  toolButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  pressedToolButton: {
    opacity: 0.6,
  },

  iconContainer: {
    width: 38,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderCurve: 'continuous',
  },

  selectedIconContainer: {
    backgroundColor: colors.primarySoft,
  },
});
