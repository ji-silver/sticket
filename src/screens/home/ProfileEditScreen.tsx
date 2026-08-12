import { useNavigation } from '@react-navigation/native';
import { ChevronRight } from 'lucide-react-native';
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

import AppText from '../../components/common/AppText.tsx';
import ScreenHeader from '../../components/common/ScreenHeader.tsx';
import { useAuth } from '../../features/auth/AuthProvider.tsx';
import { useUpdateProfile } from '../../features/profile/api/useUpdateProfile.ts';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import TeamSelectSheet from './components/TeamSelectSheet.tsx';

function ProfileEditScreen() {
  const navigation = useNavigation();
  const { profile, completeProfile } = useAuth();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [favoriteTeam, setFavoriteTeam] = useState(
    profile?.favorite_team?.name ?? '',
  );
  const [isTeamSheetOpen, setIsTeamSheetOpen] = useState(false);

  const trimmedNickname = nickname.trim();
  const isNicknameValid =
    trimmedNickname.length >= 2 && trimmedNickname.length <= 10;
  const isFormValid = isNicknameValid && favoriteTeam.length > 0;

  const handleSelectTeam = (team: string) => {
    setFavoriteTeam(team);
    setIsTeamSheetOpen(false);
  };

  const updateProfileMutation = useUpdateProfile();

  const handleSave = async () => {
    if (!isFormValid || updateProfileMutation.isPending) {
      return;
    }

    updateProfileMutation.mutate(
      {
        nickname: trimmedNickname,
        favoriteTeamName: favoriteTeam,
      },
      {
        onSuccess: nextProfile => {
          completeProfile(nextProfile);
          navigation.goBack();
        },
        onError: error => {
          console.error('프로필 수정에 실패했습니다.', error);
          Alert.alert(
            '프로필을 수정하지 못했어요',
            '잠시 후 다시 시도해 주세요.',
          );
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="프로필 수정"
        onPressBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView style={styles.keyboardArea} behavior="padding">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>닉네임</AppText>

            <View style={styles.inputCard}>
              <TextInput
                allowFontScaling={false}
                value={nickname}
                onChangeText={setNickname}
                style={styles.nicknameInput}
                maxLength={10}
                selectionColor={colors.primary}
                clearButtonMode="while-editing"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="nickname"
                textContentType="nickname"
                returnKeyType="done"
                accessibilityLabel="닉네임"
              />
            </View>
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>응원 구단</AppText>

            <View style={styles.teamCard}>
              <Pressable
                style={({ pressed }) => [
                  styles.teamRow,
                  pressed && styles.teamRowPressed,
                ]}
                onPress={() => setIsTeamSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`야구 응원 구단, ${
                  favoriteTeam || '선택 필요'
                }, 변경`}
              >
                <AppText style={styles.sportName}>야구</AppText>
                <AppText style={styles.teamName}>
                  {favoriteTeam || '응원 구단을 선택해 주세요'}
                </AppText>
                <ChevronRight
                  size={19}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              (!isFormValid || updateProfileMutation.isPending) &&
                styles.saveButtonDisabled,
              pressed &&
                isFormValid &&
                !updateProfileMutation.isPending &&
                styles.saveButtonPressed,
            ]}
            onPress={handleSave}
            disabled={!isFormValid || updateProfileMutation.isPending}
            accessibilityRole="button"
            accessibilityState={{
              disabled: !isFormValid || updateProfileMutation.isPending,
            }}
          >
            <AppText
              style={[
                styles.saveButtonText,
                (!isFormValid || updateProfileMutation.isPending) &&
                  styles.saveButtonTextDisabled,
              ]}
            >
              {updateProfileMutation.isPending ? '저장 중' : '저장'}
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <TeamSelectSheet
        visible={isTeamSheetOpen}
        selectedTeam={favoriteTeam}
        onSelect={handleSelectTeam}
        onClose={() => setIsTeamSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

export default ProfileEditScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  inputCard: {
    height: 56,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  nicknameInput: {
    padding: 0,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  teamCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  teamRow: {
    minHeight: 62,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamRowPressed: {
    backgroundColor: colors.primarySoft,
  },
  sportName: {
    width: 54,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  teamName: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  saveButton: {
    height: 54,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
  saveButtonTextDisabled: {
    color: colors.textPlaceholder,
  },
});
