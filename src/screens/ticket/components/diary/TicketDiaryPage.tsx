import { Pressable, StyleSheet, View } from 'react-native';
import {
  ImagePlus,
  Notebook,
  Pencil,
  Sticker,
  Type,
} from 'lucide-react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../../styles/colors.ts';
import AppText from '../../../../components/common/AppText.tsx';
import GridPaper from './GridPaper.tsx';

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
] as const;

type DiaryToolId = (typeof DIARY_TOOLS)[number]['id'];
type PaperType = 'plain' | 'grid';
type EditorSize = {
  width: number;
  height: number;
};

type DiaryPhoto = {
  id: string;
  uri: string;
  width: number;
  height: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

function TicketDiaryPage() {
  const [selectedTool, setSelectedTool] = useState<DiaryToolId | null>(null);
  const [paperType, setPaperType] = useState<PaperType>('plain');

  const handlePaperSelect = (next: PaperType) => {
    setPaperType(next);
    setSelectedTool(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.editorArea}>
        {paperType === 'grid' ? <GridPaper /> : null}

        {selectedTool === 'paper' ? (
          <View style={styles.paperSelector}>
            <AppText size={13} weight={'semiBold'} color={colors.text}>
              속지 선택
            </AppText>

            <View style={styles.paperOptions}>
              <Pressable
                accessibilityRole={'button'}
                accessibilityLabel={'무지 속지'}
                accessibilityState={{
                  selected: paperType === 'plain',
                }}
                onPress={() => handlePaperSelect('plain')}
                style={({ pressed }) => [
                  styles.paperOption,
                  pressed && styles.pressedPaperOption,
                ]}
              >
                <View
                  style={[
                    styles.paperPreview,
                    paperType === 'plain' && styles.selectedPaperPreview,
                  ]}
                />
                <AppText
                  size={12}
                  weight={paperType === 'plain' ? 'semiBold' : 'regular'}
                  color={
                    paperType === 'plain'
                      ? colors.primary
                      : colors.textSecondary
                  }
                >
                  무지
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="모눈 속지"
                accessibilityState={{
                  selected: paperType === 'grid',
                }}
                onPress={() => handlePaperSelect('grid')}
                style={({ pressed }) => [
                  styles.paperOption,
                  pressed && styles.pressedPaperOption,
                ]}
              >
                <View
                  style={[
                    styles.paperPreview,
                    paperType === 'grid' && styles.selectedPaperPreview,
                  ]}
                >
                  <GridPaper />
                </View>

                <AppText
                  size={12}
                  weight={paperType === 'grid' ? 'semiBold' : 'regular'}
                  color={
                    paperType === 'grid' ? colors.primary : colors.textSecondary
                  }
                >
                  모눈
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.toolbar}>
        {DIARY_TOOLS.map(tool => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          return (
            <Pressable
              key={tool.id}
              accessibilityRole={'button'}
              accessibilityLabel={`${tool.label} 도구`}
              onPress={() => setSelectedTool(tool.id)}
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
    </SafeAreaView>
  );
}

export default TicketDiaryPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  editorArea: {
    flex: 1,
    backgroundColor: colors.surface,
    position: 'relative',
    overflow: 'hidden',
  },
  paperSelector: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  paperOptions: {
    flexDirection: 'row',
    gap: 20,
  },
  paperOption: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },
  pressedPaperOption: {
    opacity: 0.6,
  },
  paperPreview: {
    width: 56,
    height: 72,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },
  selectedPaperPreview: {
    borderWidth: 2,
    borderColor: colors.primary,
  },

  toolbar: {
    flexDirection: 'row',
    height: 72,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
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
