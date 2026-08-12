import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronRight } from 'lucide-react-native';
import AppButton from '../../components/common/AppButton.tsx';
import AppText from '../../components/common/AppText.tsx';
import TeamSelectSheet from '../home/components/TeamSelectSheet.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import { saveProfile } from '../../features/profile/profile.service.ts';
import { useAuth } from '../../features/auth/AuthProvider.tsx';

function ProfileSetupScreen() {
  const { profile, completeProfile } = useAuth();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [hasBlurredNickname, setHasBlurredNickname] = useState(false);
  const [favoriteTeam, setFavoriteTeam] = useState(
    profile?.favorite_team?.name ?? '',
  );
  const [isTeamSheetOpen, setIsTeamSheetOpen] = useState(false);
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const trimmedNickname = nickname.trim();
  const isNicknameValid =
    trimmedNickname.length >= 2 && trimmedNickname.length <= 10;
  const isFormValid =
    isNicknameValid &&
    favoriteTeam.length > 0 &&
    isTermsAgreed &&
    isPrivacyAgreed;
  const showNicknameError = hasBlurredNickname && !isNicknameValid;

  const handleSelectTeam = (team: string) => {
    setFavoriteTeam(team);
    setIsTeamSheetOpen(false);
  };

  const handlePressStart = async () => {
    if (!isFormValid || isSaving) {
      setHasBlurredNickname(true);
      return;
    }

    setIsSaving(true);

    try {
      const savedProfile = await saveProfile({
        nickname: trimmedNickname,
        favoriteTeamName: favoriteTeam,
      });

      completeProfile(savedProfile);
    } catch (error) {
      console.error('프로필 저장에 실패했습니다.', error);

      Alert.alert('프로필을 저장하지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.keyboardArea} behavior="padding">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contentContainer}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <AppText style={styles.title}>프로필을 완성해 주세요</AppText>
          </View>

          <View style={styles.form}>
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <AppText style={styles.label}>닉네임</AppText>
                <AppText style={styles.characterCount}>
                  {nickname.length}/10
                </AppText>
              </View>

              <View
                style={[
                  styles.inputContainer,
                  showNicknameError && styles.inputContainerError,
                ]}
              >
                <TextInput
                  allowFontScaling={false}
                  value={nickname}
                  onChangeText={setNickname}
                  onBlur={() => setHasBlurredNickname(true)}
                  style={styles.nicknameInput}
                  placeholder="닉네임을 입력해 주세요"
                  placeholderTextColor={colors.textPlaceholder}
                  selectionColor={colors.primary}
                  maxLength={10}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="nickname"
                  textContentType="nickname"
                  returnKeyType="done"
                  clearButtonMode="while-editing"
                  accessibilityLabel="닉네임"
                />
              </View>

              <AppText
                style={[
                  styles.helperText,
                  showNicknameError && styles.errorText,
                ]}
              >
                {showNicknameError
                  ? '닉네임을 2자 이상 입력해 주세요'
                  : '2~10자로 입력해 주세요'}
              </AppText>
            </View>

            <View style={styles.section}>
              <AppText style={styles.label}>응원 구단</AppText>

              <Pressable
                style={({ pressed }) => [
                  styles.teamButton,
                  pressed && styles.teamButtonPressed,
                ]}
                onPress={() => setIsTeamSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={
                  favoriteTeam
                    ? `응원 구단 ${favoriteTeam}, 변경`
                    : '응원 구단 선택'
                }
              >
                <AppText
                  style={[
                    styles.teamButtonText,
                    !favoriteTeam && styles.teamPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {favoriteTeam || '응원 구단을 선택해 주세요'}
                </AppText>
                <ChevronRight
                  size={19}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              </Pressable>

              <AppText style={styles.helperText}>
                현재는 야구 서비스만 지원하고있어요
              </AppText>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={styles.agreementRow}
            onPress={() => setIsTermsAgreed(!isTermsAgreed)}
            accessibilityRole="checkbox"
            accessibilityLabel="필수 이용약관 동의"
            accessibilityState={{ checked: isTermsAgreed }}
          >
            <View
              style={[styles.checkbox, isTermsAgreed && styles.checkboxActive]}
            >
              {isTermsAgreed && (
                <Check size={14} color={colors.surface} strokeWidth={3} />
              )}
            </View>
            <AppText style={styles.agreementText}>
              <AppText style={styles.agreementHighlight}>(필수) </AppText>만
              14세 이상이며, 이용약관에 동의합니다.
            </AppText>
          </Pressable>

          <Pressable
            style={[styles.agreementRow, styles.lastAgreementRow]}
            onPress={() => setIsPrivacyAgreed(!isPrivacyAgreed)}
            accessibilityRole="checkbox"
            accessibilityLabel="필수 개인정보 처리방침 동의"
            accessibilityState={{ checked: isPrivacyAgreed }}
          >
            <View
              style={[
                styles.checkbox,
                isPrivacyAgreed && styles.checkboxActive,
              ]}
            >
              {isPrivacyAgreed && (
                <Check size={14} color={colors.surface} strokeWidth={3} />
              )}
            </View>
            <AppText style={styles.agreementText}>
              <AppText style={styles.agreementHighlight}>(필수) </AppText>
              개인정보 처리방침을 확인하고 동의합니다.
            </AppText>
          </Pressable>

          <AppButton
            style={({ pressed }) => [
              styles.startButton,
              (!isFormValid || isSaving) && styles.startButtonDisabled,
              pressed && isFormValid && !isSaving && styles.startButtonPressed,
            ]}
            onPress={handlePressStart}
            disabled={!isFormValid || isSaving}
            accessibilityRole="button"
            accessibilityLabel="프로필 설정 완료하고 시작하기"
            accessibilityState={{
              disabled: !isFormValid || isSaving,
            }}
          >
            <AppText
              style={[
                styles.startButtonText,
                (!isFormValid || isSaving) && styles.startButtonTextDisabled,
              ]}
            >
              {isSaving ? '저장 중' : '시작하기'}
            </AppText>
          </AppButton>
        </View>
      </KeyboardAvoidingView>

      <TeamSelectSheet
        visible={isTeamSheetOpen}
        title="응원 구단 선택"
        selectedTeam={favoriteTeam}
        onSelect={handleSelectTeam}
        onClose={() => setIsTeamSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

export default ProfileSetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
  },
  intro: {
    gap: 10,
  },
  title: {
    fontSize: 27,
    lineHeight: 35,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  form: {
    marginTop: 38,
    gap: 30,
  },
  section: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  inputContainer: {
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  inputContainerError: {
    borderColor: '#D64545',
  },
  nicknameInput: {
    padding: 0,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  errorText: {
    color: '#D64545',
  },
  teamButton: {
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  teamButtonText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  teamPlaceholder: {
    color: colors.textPlaceholder,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  startButton: {
    height: 54,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  startButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
  startButtonTextDisabled: {
    color: colors.textPlaceholder,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
    gap: 10,
  },
  lastAgreementRow: {
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  agreementText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  agreementHighlight: {
    color: colors.primary,
    fontFamily: fonts.bold,
  },
});
