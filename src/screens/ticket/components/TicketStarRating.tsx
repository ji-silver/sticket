import { Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../../../styles/colors.ts';

interface TicketStarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

const ratingOptions = [1, 2, 3, 4, 5];
const starButtonSize = 42;
const accessibilityActions = [
  { name: 'increment', label: '0.5점 올리기' },
  { name: 'decrement', label: '0.5점 내리기' },
];

function TicketStarRating({ value, onChange }: TicketStarRatingProps) {
  const changeRating = (amount: number) => {
    onChange(Math.min(5, Math.max(0, value + amount)));
  };

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="경기 만족도"
      accessibilityValue={{
        min: 0,
        max: 5,
        now: value,
        text: `${value}점`,
      }}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'increment') {
          changeRating(0.5);
        }

        if (event.nativeEvent.actionName === 'decrement') {
          changeRating(-0.5);
        }
      }}
    >
      {ratingOptions.map(option => {
        const fillAmount = value - (option - 1);
        const isFull = fillAmount >= 1;
        const isHalf = fillAmount === 0.5;

        return (
          <Pressable
            key={option}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={event =>
              onChange(
                event.nativeEvent.locationX < starButtonSize / 2
                  ? option - 0.5
                  : option,
              )
            }
            accessible={false}
          >
            <View style={styles.icon} pointerEvents="none">
              <Star
                size={28}
                color={colors.disabled}
                fill="transparent"
                strokeWidth={2}
              />

              {isFull || isHalf ? (
                <View
                  style={[
                    styles.fill,
                    isHalf ? styles.fillHalf : styles.fillFull,
                  ]}
                >
                  <Star
                    size={28}
                    color={colors.primary}
                    fill={colors.primary}
                    strokeWidth={2}
                  />
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default TicketStarRating;

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: starButtonSize,
    height: starButtonSize,
    borderRadius: starButtonSize / 2,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.primarySoft,
  },
  icon: {
    position: 'relative',
    width: 28,
    height: 28,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 28,
    overflow: 'hidden',
  },
  fillHalf: {
    width: 14,
  },
  fillFull: {
    width: 28,
  },
});
