import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { colors } from '../../../styles/colors.ts';

const GRID_SIZE = 20;
const GRID_LINE_COLOR = '#7A8793';

function GridPaper() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="diaryGrid"
            width={GRID_SIZE}
            height={GRID_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <Path
              d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
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
