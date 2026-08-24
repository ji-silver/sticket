import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

interface ProfileSummarySectionProps {
  nickname: string;
  favoriteTeamName: string;
  season: number;
  seasonTicketSeatName: string | null;
  onPressEdit: () => void;
}

function ProfileSummarySection({
  nickname,
  favoriteTeamName,
  season,
  seasonTicketSeatName,
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
          tone="primary"
          onPress={onPressEdit}
          accessibilityLabel="프로필 수정"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <AppText style={styles.infoLabel}>응원 구단</AppText>

        <View style={styles.valueColumn}>
          <AppText style={styles.infoValue}>{favoriteTeamName}</AppText>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <AppText style={styles.infoLabel}>시즌권 좌석</AppText>

        <View style={styles.valueColumn}>
          <AppText
            style={[
              styles.infoValue,
              !seasonTicketSeatName && styles.emptyValue,
            ]}
          >
            {seasonTicketSeatName ?? '없음'}
          </AppText>

          {seasonTicketSeatName ? (
            <AppText style={styles.valueCaption}>{season} 시즌</AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default ProfileSummarySection;

const styles = StyleSheet.create({
  profileCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },

  profileCardTop: {
    minHeight: 78,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    marginHorizontal: 20,
    backgroundColor: colors.border,
  },

  emptyValue: {
    color: colors.textSecondary,
  },

  infoRow: {
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },

  infoLabel: {
    width: 72,
    fontSize: 13,
    lineHeight: 21,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  valueColumn: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },

  infoValue: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'right',
  },

  valueCaption: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
});
