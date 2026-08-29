import { forwardRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import AppText from '../../../../components/common/AppText.tsx';
import type { Ticket } from '../../../../features/ticket/types.ts';
import { colors } from '../../../../styles/colors.ts';
import { fonts } from '../../../../styles/fonts.ts';
import { getDiaryExportGameInfo } from './diaryExport.ts';
import type { EditorSize } from './photoTransform.ts';

interface DiaryExportCardProps {
  ticket: Ticket;
  diaryImageUri: string;
  pageSize: EditorSize;
  onImageLoad: () => void;
  onImageError: () => void;
}

const DiaryExportCard = forwardRef<View, DiaryExportCardProps>(
  function DiaryExportCardContent(
    { ticket, diaryImageUri, pageSize, onImageLoad, onImageError },
    ref,
  ) {
    const gameInfo = getDiaryExportGameInfo(ticket);

    return (
      <View
        ref={ref}
        collapsable={false}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.card, { width: pageSize.width }]}
      >
        <View style={styles.gameInfo}>
          <AppText style={styles.detail}>{gameInfo.detail}</AppText>
          <AppText style={styles.matchup}>{gameInfo.matchup}</AppText>
        </View>

        <Image
          source={{ uri: diaryImageUri }}
          resizeMode="stretch"
          onLoad={onImageLoad}
          onError={onImageError}
          style={{ width: pageSize.width, height: pageSize.height }}
        />
      </View>
    );
  },
);

export default DiaryExportCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
  },

  gameInfo: {
    height: 88,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.surface,
  },

  detail: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  matchup: {
    fontSize: 17,
    lineHeight: 23,
    fontFamily: fonts.bold,
    color: colors.text,
  },
});
