import { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../../../../styles/colors.ts';
import {
  DIARY_STICKER_PACKS,
  type DiaryStickerDefinition,
} from './diaryStickerPacks.ts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DiaryStickerPickerProps {
  onSelectSticker: (sticker: DiaryStickerDefinition) => void;
  onClose: () => void;
}

function DiaryStickerPicker({
  onSelectSticker,
  onClose,
}: DiaryStickerPickerProps) {
  const { bottom } = useSafeAreaInsets();
  const [selectedPackId, setSelectedPackId] = useState(
    DIARY_STICKER_PACKS[0]?.id ?? '',
  );

  const selectedPack =
    DIARY_STICKER_PACKS.find(pack => pack.id === selectedPackId) ??
    DIARY_STICKER_PACKS[0];

  if (selectedPack === undefined) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.packRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.packScroll}
          contentContainerStyle={styles.packList}
        >
          {DIARY_STICKER_PACKS.map((pack, index) => {
            const representativeSticker =
              pack.stickers.find(
                sticker => sticker.id === pack.representativeStickerId,
              ) ?? pack.stickers[0];

            if (representativeSticker === undefined) {
              return null;
            }

            const isSelected = pack.id === selectedPack.id;

            return (
              <Pressable
                key={pack.id}
                accessibilityRole="tab"
                accessibilityLabel={`스티커팩 ${index + 1}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedPackId(pack.id)}
                style={({ pressed }) => [
                  styles.packButton,
                  isSelected && styles.selectedPackButton,
                  pressed && styles.pressedButton,
                ]}
              >
                <Image
                  accessible={false}
                  source={representativeSticker.source}
                  resizeMode="contain"
                  style={styles.packImage}
                />
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="스티커 선택 닫기"
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressedButton,
          ]}
        >
          <X size={20} strokeWidth={2} color={colors.textSecondary} />
        </Pressable>
      </View>

      <FlatList
        key={selectedPack.id}
        data={selectedPack.stickers}
        keyExtractor={sticker => sticker.id}
        numColumns={4}
        showsVerticalScrollIndicator={false}
        style={styles.stickerList}
        contentContainerStyle={[
          styles.stickerGrid,
          {
            paddingBottom: Math.max(8, bottom),
          },
        ]}
        renderItem={({ item: sticker, index }) => (
          <View style={styles.stickerCell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`스티커 ${index + 1} 추가`}
              onPress={() => onSelectSticker(sticker)}
              style={({ pressed }) => [
                styles.stickerButton,
                pressed && styles.pressedButton,
              ]}
            >
              <Image
                accessible={false}
                source={sticker.source}
                resizeMode="contain"
                style={styles.stickerImage}
              />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

export default DiaryStickerPicker;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: '48%',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  packRow: {
    flexDirection: 'row',
    paddingBottom: 8,
  },

  packList: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 8,
  },

  packScroll: {
    flex: 1,
  },

  packButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },

  selectedPackButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  closeButton: {
    width: 48,
    height: 48,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    backgroundColor: colors.surface,
  },

  packImage: {
    width: 38,
    height: 38,
  },

  stickerGrid: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  stickerList: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },

  stickerCell: {
    width: '25%',
    padding: 4,
  },

  stickerButton: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
  },

  pressedButton: {
    opacity: 0.6,
    backgroundColor: colors.primarySoft,
  },

  stickerImage: {
    width: '80%',
    height: '80%',
    maxWidth: 96,
    maxHeight: 96,
  },
});
