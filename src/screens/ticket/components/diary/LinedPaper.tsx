import { StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { colors } from '../../../../styles/colors.ts';
import {
  REFERENCE_DIARY_PAGE_HEIGHT,
  REFERENCE_DIARY_PAGE_WIDTH,
} from './diaryLayout.ts';

const LINE_SPACING = 28;
const LINE_COLOR = '#E1E4E8';
const LINE_INDEXES = Array.from({ length: 40 }, (_, index) => index + 1);

function LinedPaper() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${REFERENCE_DIARY_PAGE_WIDTH} ${REFERENCE_DIARY_PAGE_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <Rect width="100%" height="100%" fill={colors.surface} />

        {LINE_INDEXES.map(index => (
          <Line
            key={index}
            x1="0"
            y1={index * LINE_SPACING}
            x2="100%"
            y2={index * LINE_SPACING}
            stroke={LINE_COLOR}
            strokeWidth={1}
          />
        ))}
      </Svg>
    </View>
  );
}

export default LinedPaper;

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
