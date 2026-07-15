import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
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
  selectedTeam: string;
  onSelect: (team: string) => void;
  onClose: () => void;
}

function TeamSelectSheet({
  visible,
  selectedTeam,
  onSelect,
  onClose,
}: TeamSelectSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="응원 구단 선택 닫기"
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText style={styles.title}>응원 구단 변경</AppText>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            >
              <X size={22} color={colors.textSecondary} strokeWidth={2.2} />
            </Pressable>
          </View>

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
                    <Check
                      size={16}
                      color={colors.onPrimary}
                      strokeWidth={2.8}
                    />
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
        </View>
      </View>
    </Modal>
  );
}

export default TeamSelectSheet;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    marginBottom: 24,
    borderRadius: 3,
    backgroundColor: colors.disabled,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    marginTop: -6,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
