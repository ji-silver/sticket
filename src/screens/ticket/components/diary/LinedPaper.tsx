import { StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { colors } from '../../../../styles/colors.ts';
import {
  getDiaryPageSize,
  getDiaryPaperSpacing,
} from './diaryLayout.ts';
import type { EditorSize } from './photoTransform.ts';

const LINE_COLOR = '#E8EAED';
const LINE_INDEXES = Array.from({ length: 40 }, (_, index) => index + 1);

interface LinedPaperProps {
  isPreview?: boolean;
  pageSize?: EditorSize;
}

function LinedPaper({
  isPreview = false,
  pageSize = getDiaryPageSize('portrait'),
}: LinedPaperProps) {
  const lineSpacing = getDiaryPaperSpacing(pageSize, isPreview).line;

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
        <Rect width="100%" height="100%" fill={colors.surface} />

        {LINE_INDEXES.map(index => (
          <Line
            key={index}
            x1="0"
            y1={index * lineSpacing}
            x2="100%"
            y2={index * lineSpacing}
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
