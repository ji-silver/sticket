가import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
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
import AppText from '../../components/common/AppText.tsx';
import InlineActionButton from '../../components/common/InlineActionButton.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';

const favoriteTeams = [
  { id: 1, sport: '야구', team: 'SSG 랜더스' },
  { id: 2, sport: '축구', team: 'FC 서울' },
];

function ProfileEditScreen() {
  const navigation = useNavigation();

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
              {favoriteTeams.map((favoriteTeam, index) => (
                <View key={favoriteTeam.id}>
                  {index > 0 && <View style={styles.divider} />}

                  <Pressable
                    style={({ pressed }) => [
                      styles.teamRow,
                      pressed && styles.teamRowPressed,
                    ]}
                    onPress={() => {}}
                    accessibilityRole="button"
                    accessibilityLabel={`${favoriteTeam.sport} 응원 구단, ${favoriteTeam.team}`}
                  >
                    <AppText style={styles.sportName}>
                      {favoriteTeam.sport}
                    </AppText>
                    <AppText style={styles.teamName}>
                      {favoriteTeam.team}
                    </AppText>
                    <ChevronRight
                      size={19}
                      color={colors.textSecondary}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.addTeamButton}>
              <InlineActionButton
                label="응원 구단 추가"
                icon={
                  <Plus size={18} color={colors.primary} strokeWidth={2.2} />
                }
                tone="primary"
                onPress={() => {}}
              />
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
    height: 60,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    marginLeft: -8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  headerTitle: {
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
  divider: {
    height: 1,
    marginHorizontal: 18,
    backgroundColor: colors.border,
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
  addTeamButton: {
    marginLeft: -8,
    alignItems: 'flex-start',
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
