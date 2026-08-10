import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

interface ProfileSummarySectionProps {
  nickname: string;
  favoriteTeamName: string;
  onPressEdit: () => void;
}

function ProfileSummarySection({
  nickname,
  favoriteTeamName,
  onPressEdit,
}: ProfileSummarySectionProps) {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileCardTop}>
        <View style={styles.profileTextArea}>
          <AppText style={styles.label}>닉네임</AppText>

          <AppText style={styles.nickname}>{nickname}</AppText>
        </View>

        <InlineActionButton
          label="수정"
          onPress={onPressEdit}
          accessibilityLabel="프로필 수정"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.favoriteSection}>
        <AppText style={styles.label}>응원 구단</AppText>

        <View style={styles.favoriteTeamList}>
          <View style={styles.favoriteTeamRow}>
            <AppText style={styles.sportName}>야구</AppText>

            <AppText style={styles.teamName}>{favoriteTeamName}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

export default ProfileSummarySection;

const styles = StyleSheet.create({
  profileCard: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },

  profileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },

  profileTextArea: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  nickname: {
    marginTop: 4,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  divider: {
    height: 1,
    marginVertical: 20,
    backgroundColor: colors.border,
  },

  favoriteSection: {
    gap: 10,
  },

  favoriteTeamList: {
    gap: 10,
  },

  favoriteTeamRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  sportName: {
    width: 48,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  teamName: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },
});
