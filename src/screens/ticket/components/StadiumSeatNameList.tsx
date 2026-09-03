import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

interface StadiumSeatNameListProps {
  seatNames: readonly string[];
  seatName: string;
  onSelect: (seatName: string) => void;
}

function StadiumSeatNameList({
  seatNames,
  seatName,
  onSelect,
}: StadiumSeatNameListProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {seatNames.map(option => {
        const isSelected = option === seatName;

        return (
          <Pressable
            key={option}
            style={({ pressed }) => [
              styles.row,
              pressed && styles.rowPressed,
            ]}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <AppText style={styles.label}>{option}</AppText>
            {isSelected ? (
              <Check size={19} color={colors.primary} strokeWidth={2.2} />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default StadiumSeatNameList;

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowPressed: {
    opacity: 0.55,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
});
