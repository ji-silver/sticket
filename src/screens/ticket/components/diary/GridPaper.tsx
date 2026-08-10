import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { colors } from '../../../../styles/colors.ts';
import {
  REFERENCE_DIARY_PAGE_HEIGHT,
  REFERENCE_DIARY_PAGE_WIDTH,
} from './diaryLayout.ts';

const GRID_SIZE = 20;
const GRID_LINE_COLOR = '#7A8793';

function GridPaper() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${REFERENCE_DIARY_PAGE_WIDTH} ${REFERENCE_DIARY_PAGE_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <Pattern
            id="diaryGrid"
            width={GRID_SIZE}
            height={GRID_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <Path
              d={`M ${GRID_SIZE} 0 V ${GRID_SIZE} H 0`}
              fill="none"
              stroke={GRID_LINE_COLOR}
              strokeWidth={StyleSheet.hairlineWidth}
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
