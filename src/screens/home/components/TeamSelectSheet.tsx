import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

const KBO_TEAMS = [
  'SSG 랜더스',
  'LG 트윈스',
  '두산 베어스',
  'KIA 타이거즈',
  '삼성 라이온즈',
  '롯데 자이언츠',
  '한화 이글스',
  '키움 히어로즈',
  'KT 위즈',
  'NC 다이노스',
];

interface TeamSelectSheetProps {
  visible: boolean;
  title?: string;
  selectedTeam: string;
  onSelect: (team: string) => void;
  onClose: () => void;
}

function TeamSelectSheet({
  visible,
  title = '응원 구단 변경',
  selectedTeam,
  onSelect,
  onClose,
}: TeamSelectSheetProps) {
  return (
    <AppBottomSheet
      visible={visible}
      title={title}
      onClose={onClose}
      closeAccessibilityLabel="응원 구단 선택 닫기"
    >
      <View style={styles.teamGrid}>
        {KBO_TEAMS.map(team => {
          const isSelected = selectedTeam === team;

          return (
            <Pressable
              key={team}
              style={({ pressed }) => [
                styles.teamButton,
                isSelected && styles.teamButtonSelected,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => onSelect(team)}
              accessibilityRole="button"
              accessibilityLabel={`${team} 선택`}
              accessibilityState={{ selected: isSelected }}
            >
              {isSelected && (
                <Check size={16} color={colors.onPrimary} strokeWidth={2.8} />
              )}
              <AppText
                style={[
                  styles.teamButtonText,
                  isSelected && styles.teamButtonTextSelected,
                ]}
                numberOfLines={1}
              >
                {team}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </AppBottomSheet>
  );
}

export default TeamSelectSheet;

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.6,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  teamButton: {
    width: '48.3%',
    height: 54,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  teamButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  teamButtonText: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  teamButtonTextSelected: {
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
