import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ChevronRight, LogOut } from 'lucide-react-native';
import AppText from '../../components/common/AppText.tsx';
import FilterChip from '../../components/common/FilterChip.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';

const profile = {
  nickname: '지은',
  favoriteTeams: [
    {
      id: 1,
      sport: '야구',
      team: 'SSG 랜더스',
    },
    {
      id: 2,
      sport: '축구',
      team: 'FC 서울',
    },
  ],
};

const attendanceRecords = [
  { id: 0, label: '전체', win: 3, lose: 1, draw: 1 },
  { id: 1, label: '야구', win: 2, lose: 1, draw: 0 },
  { id: 2, label: '축구', win: 1, lose: 0, draw: 1 },
];

const appVersion = '0.0.1';

function ProfileScreen() {
  const [selectedRecordId, setSelectedRecordId] = useState(0);
  const attendanceRecord =
    attendanceRecords.find(record => record.id === selectedRecordId) ??
    attendanceRecords[0];
  const totalGames =
    attendanceRecord.win + attendanceRecord.lose + attendanceRecord.draw;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>프로필</AppText>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileCardTop}>
            <View style={styles.profileTextArea}>
              <AppText style={styles.label}>닉네임</AppText>
              <AppText style={styles.nickname}>{profile.nickname}</AppText>
            </View>

            <Pressable
              onPress={() => {}}
              style={styles.editButton}
              hitSlop={8}
              accessibilityRole={'button'}
              accessibilityLabel={'프로필 수정'}
            >
              <AppText style={styles.editButtonText}>수정</AppText>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.favoriteSection}>
            <AppText style={styles.label}>응원 구단</AppText>

            <View style={styles.favoriteTeamList}>
              {profile.favoriteTeams.map(favoriteTeam => (
                <View key={favoriteTeam.id} style={styles.favoriteTeamRow}>
                  <AppText style={styles.sportName}>
                    {favoriteTeam.sport}
                  </AppText>
                  <AppText style={styles.teamName}>{favoriteTeam.team}</AppText>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <AppText style={styles.sectionTitle}>직관 요약</AppText>

          <View style={styles.summaryFilterList}>
            {attendanceRecords.map(record => {
              const isSelected = selectedRecordId === record.id;

              return (
                <FilterChip
                  key={record.id}
                  label={record.label}
                  selected={isSelected}
                  onPress={() => setSelectedRecordId(record.id)}
                />
              );
            })}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryMetric}>
              <AppText style={styles.summaryLabel}>누적 직관</AppText>
              <AppText style={styles.totalGamesText}>{totalGames}경기</AppText>
            </View>

            <View style={styles.summaryDivider} />

            <View style={[styles.summaryMetric, styles.recordMetric]}>
              <AppText style={styles.summaryLabel}>직관 성적</AppText>
              <AppText style={styles.recordText}>
                {attendanceRecord.win}승 · {attendanceRecord.draw}무 ·{' '}
                {attendanceRecord.lose}패
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.serviceSection}>
          <AppText style={styles.sectionTitle}>서비스 정보</AppText>

          <View style={styles.serviceCard}>
            <Pressable
              style={({ pressed }) => [
                styles.serviceRow,
                pressed && styles.serviceRowPressed,
              ]}
              onPress={() => {}}
              accessibilityRole="button"
            >
              <AppText style={styles.serviceRowText}>이용약관</AppText>
              <ChevronRight
                size={18}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            </Pressable>

            <View style={styles.serviceDivider} />

            <Pressable
              style={({ pressed }) => [
                styles.serviceRow,
                pressed && styles.serviceRowPressed,
              ]}
              onPress={() => {}}
              accessibilityRole="button"
            >
              <AppText style={styles.serviceRowText}>개인정보 처리방침</AppText>
              <ChevronRight
                size={18}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            </Pressable>

            <View style={styles.serviceDivider} />

            <View style={styles.serviceRow}>
              <AppText style={styles.serviceRowText}>앱 버전</AppText>
              <AppText style={styles.serviceValue}>{appVersion}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.accountSection}>
          <AppText style={styles.sectionTitle}>계정 관리</AppText>

          <View style={styles.serviceCard}>
            <Pressable
              style={({ pressed }) => [
                styles.serviceRow,
                pressed && styles.serviceRowPressed,
              ]}
              onPress={() => {}}
              accessibilityRole="button"
            >
              <AppText style={styles.serviceRowText}>로그아웃</AppText>
              <LogOut size={18} color={colors.secondary} strokeWidth={2} />
            </Pressable>

            <View style={styles.serviceDivider} />

            <Pressable
              style={({ pressed }) => [
                styles.serviceRow,
                pressed && styles.serviceRowPressed,
              ]}
              onPress={() => {}}
              accessibilityRole="button"
            >
              <AppText style={styles.withdrawalText}>회원 탈퇴</AppText>
              <ChevronRight size={18} color="#D92D20" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 32,
  },
  header: {
    minHeight: 42,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.bold,
  },

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
    color: colors.secondary,
  },
  nickname: {
    marginTop: 4,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  editButton: {
    minWidth: 54,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  editButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
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
    color: colors.secondary,
  },
  teamName: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  summarySection: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  summaryFilterList: {
    marginBottom: 12,
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    minHeight: 108,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryMetric: {
    minWidth: 82,
  },
  recordMetric: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.secondary,
  },
  totalGamesText: {
    marginTop: 6,
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  recordText: {
    marginTop: 6,
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 23,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  summaryDivider: {
    width: 1,
    height: 52,
    marginHorizontal: 18,
    backgroundColor: colors.border,
  },

  serviceSection: {
    marginTop: 32,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  serviceRow: {
    minHeight: 54,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceRowPressed: {
    backgroundColor: colors.background,
  },
  serviceRowText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  serviceValue: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.secondary,
  },
  serviceDivider: {
    height: 1,
    marginLeft: 18,
    backgroundColor: colors.border,
  },
  accountSection: {
    marginTop: 32,
  },
  withdrawalText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#D92D20',
  },
});
