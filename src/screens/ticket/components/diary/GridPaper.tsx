import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { colors } from '../../../../styles/colors.ts';
import {
  getDiaryPageSize,
  getDiaryPaperSpacing,
} from './diaryLayout.ts';
import type { EditorSize } from './photoTransform.ts';

const GRID_LINE_COLOR = '#9AA4AE';
const PREVIEW_GRID_LINE_COLOR = '#E2E6EA';

interface GridPaperProps {
  isPreview?: boolean;
  pageSize?: EditorSize;
}

function GridPaper({
  isPreview = false,
  pageSize = getDiaryPageSize('portrait'),
}: GridPaperProps) {
  const gridSize = getDiaryPaperSpacing(pageSize, isPreview).grid;

  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg
        width="100%"
        height="100%"
        viewBox={
          isPreview
            ? undefined
            : `0 0 ${pageSize.width} ${pageSize.height}`
        }
        preserveAspectRatio="none"
      >
        <Defs>
          <Pattern
            id="diaryGrid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <Path
              d={`M ${gridSize} 0 V ${gridSize} H 0`}
              fill="none"
              stroke={isPreview ? PREVIEW_GRID_LINE_COLOR : GRID_LINE_COLOR}
              strokeWidth={isPreview ? 1 : StyleSheet.hairlineWidth}
            />
          </Pattern>
        </Defs>

        <Rect width="100%" height="100%" fill={colors.surface} />
        <Rect width="100%" height="100%" fill="url(#diaryGrid)" />
      </Svg>
    </View>
  );
}

export default GridPaper;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.surface,
  },
});
