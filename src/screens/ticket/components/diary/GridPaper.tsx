import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { colors } from '../../../../styles/colors.ts';
import {
  REFERENCE_DIARY_PAGE_HEIGHT,
  REFERENCE_DIARY_PAGE_WIDTH,
} from './diaryLayout.ts';

const GRID_SIZE = 20;
const PREVIEW_GRID_SIZE = 8;
const GRID_LINE_COLOR = '#7A8793';
const PREVIEW_GRID_LINE_COLOR = '#D9DEE3';

interface GridPaperProps {
  isPreview?: boolean;
}

function GridPaper({ isPreview = false }: GridPaperProps) {
  const gridSize = isPreview ? PREVIEW_GRID_SIZE : GRID_SIZE;

  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg
        width="100%"
        height="100%"
        viewBox={
          isPreview
            ? undefined
            : `0 0 ${REFERENCE_DIARY_PAGE_WIDTH} ${REFERENCE_DIARY_PAGE_HEIGHT}`
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
