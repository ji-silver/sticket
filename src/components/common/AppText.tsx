import {
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  StyleProp,
} from 'react-native';
import { fonts } from '../../styles/fonts.ts';
import { colors } from '../../styles/colors.ts';

type AppTextWeight =
  | 'regular'
  | 'medium'
  | 'semiBold'
  | 'bold'
  | 'extraBold'
  | 'black';

interface AppTextProps extends TextProps {
  size?: number;
  color?: string;
  weight?: AppTextWeight;
  align?: TextStyle['textAlign'];
  lineHeight?: number;
  style?: StyleProp<TextStyle>;
}

function AppText({
  size,
  color,
  weight = 'regular',
  align,
  lineHeight,
  style,
  children,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.text,
        {
          fontFamily: fonts[weight],
          fontSize: size,
          color,
          textAlign: align,
          lineHeight,
        },
        style,
        styles.fontWeightReset,
      ]}
    >
      {children}
    </Text>
  );
}

export default AppText;

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.regular,
    color: colors.text,
  },
  fontWeightReset: {
    fontWeight: undefined,
  },
});
