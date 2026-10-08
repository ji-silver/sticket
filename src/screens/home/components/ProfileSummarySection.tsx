import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText.tsx';
import SecondaryButton from '../../../components/common/SecondaryButton.tsx';
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
      <AppText
        style={styles.nickname}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {nickname}
      </AppText>
      <SecondaryButton
        label="프로필 수정"
        onPress={onPressEdit}
        accessibilityLabel="프로필 수정"
      />
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
});
