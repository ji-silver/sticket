import type { ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { CalendarX } from 'lucide-react-native';
import AppText from './AppText.tsx';
import { fonts } from '../../styles/fonts.ts';

interface EmptyCardProps {
  title: string;
  description: string;
  children?: ReactElement;
  style?: StyleProp<ViewStyle>;
}

function EmptyCard({ title, description, children, style }: EmptyCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.icon}>
        <CalendarX size={22} color="#777777" strokeWidth={2} />
      </View>

      <View style={styles.textGroup}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.description}>{description}</AppText>
      </View>

      {children}
    </View>
  );
}

export default EmptyCard;

const styles = StyleSheet.create({
  card: {
    minHeight: 210,
    padding: 28,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#333333',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: '#777777',
    textAlign: 'center',
  },
});
