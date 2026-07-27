import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';

import AppText from '../../components/common/AppText.tsx';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import TeamSelectSheet from '../home/components/TeamSelectSheet.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';

type ProfileSetupNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProfileSetup'
>;

function ProfileSetupScreen() {
  const navigation = useNavigation<ProfileSetupNavigationProp>();
  const [nickname, setNickname] = useState('');
  const [hasBlurredNickname, setHasBlurredNickname] = useState(false);
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [isTeamSheetOpen, setIsTeamSheetOpen] = useState(false);

  const trimmedNickname = nickname.trim();
  const isNicknameValid =
    trimmedNickname.length >= 2 && trimmedNickname.length <= 10;
  const showNicknameError = hasBlurredNickname && !isNicknameValid;

  const handleSelectTeam = (team: string) => {
    setFavoriteTeam(team);
    setIsTeamSheetOpen(false);
  };

  const handlePressStart = () => {
    if (!isNicknameValid) {
      setHasBlurredNickname(true);
      return;
    }

    // TODO: 닉네임과 응원 구단 저장 API 연동
    navigation.replace('MainTab');
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
            <AppText style={styles.description}>
              스티켓에서 사용할 정보를 설정해요.{'\n'}
              언제든 프로필에서 바꿀 수 있어요.
            </AppText>
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
              <View style={styles.teamLabelRow}>
                <AppText style={styles.label}>응원 구단</AppText>
                <AppText style={styles.optionalText}>선택 사항</AppText>
              </View>

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
                현재는 야구만 지원해요. 다른 스포츠는 추후 추가될 예정이에요.
              </AppText>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              !isNicknameValid && styles.startButtonDisabled,
              pressed && isNicknameValid && styles.startButtonPressed,
            ]}
            onPress={handlePressStart}
            disabled={!isNicknameValid}
            accessibilityRole="button"
            accessibilityLabel="프로필 설정 완료하고 시작하기"
            accessibilityState={{ disabled: !isNicknameValid }}
          >
            <AppText
              style={[
                styles.startButtonText,
                !isNicknameValid && styles.startButtonTextDisabled,
              ]}
            >
              시작하기
            </AppText>
          </Pressable>
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
  teamLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  label: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  optionalText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
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
    borderRadius: 18,
    borderCurve: 'continuous',
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
});
