import { Pressable, StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

interface ProfileSummarySectionProps {
  nickname: string;
  onPressEdit: () => void;
}

function ProfileSummarySection({
  nickname,
  onPressEdit,
}: ProfileSummarySectionProps) {
  return (
    <View style={styles.identity}>
      <AppText style={styles.nickname}>{nickname}</AppText>
      <Pressable
        onPress={onPressEdit}
        accessibilityRole="button"
        accessibilityLabel="프로필 수정"
        style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
      >
        <AppText style={styles.editLabel}>프로필 수정</AppText>
      </Pressable>
    </View>
  );
}

export default ProfileSummarySection;

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  nickname: {
    flex: 1,
    minWidth: 0,
    fontSize: 30,
    lineHeight: 40,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  editButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editLabel: { fontSize: 13, fontFamily: fonts.bold, color: colors.text },
  pressed: { opacity: 0.55 },
});
