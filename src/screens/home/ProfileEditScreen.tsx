import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import AppText from '../../components/common/AppText.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import TeamSelectSheet from './components/TeamSelectSheet.tsx';

function ProfileEditScreen() {
  const navigation = useNavigation();
  const [favoriteTeam, setFavoriteTeam] = useState('SSG 랜더스');
  const [isTeamSheetOpen, setIsTeamSheetOpen] = useState(false);

  const handleSelectTeam = (team: string) => {
    setFavoriteTeam(team);
    setIsTeamSheetOpen(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <ChevronLeft size={26} color={colors.text} strokeWidth={2.4} />
        </Pressable>

        <AppText style={styles.headerTitle}>프로필 수정</AppText>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
                defaultValue="지은"
                style={styles.nicknameInput}
                selectionColor={colors.primary}
                clearButtonMode="while-editing"
                autoCorrect={false}
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
                accessibilityLabel={`야구 응원 구단, ${favoriteTeam}, 변경`}
              >
                <AppText style={styles.sportName}>야구</AppText>
                <AppText style={styles.teamName}>{favoriteTeam}</AppText>
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
              pressed && styles.saveButtonPressed,
            ]}
            onPress={() => {}}
            accessibilityRole="button"
          >
            <AppText style={styles.saveButtonText}>저장</AppText>
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
  header: {
    height: 52,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 34,
    height: 34,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  headerTitle: {
    marginLeft: 2,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
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
    color: colors.secondary,
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
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
