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
import { ChevronLeft } from 'lucide-react-native';
import AppText from '../../components/common/AppText.tsx';
import { fonts } from '../../styles/fonts.ts';
import { useNavigation } from '@react-navigation/core';
import { useState } from 'react';
import AppCalendar from '../../components/common/AppCalendar.tsx';
import { DateData } from 'react-native-calendars';
import { colors } from '../../styles/colors.ts';
import EmptyCard from '../../components/common/EmptyCard.tsx';
import InlineActionButton from '../../components/common/InlineActionButton.tsx';

interface KboGame {
  id: number;
  date: string;
  time: string;
  stadiumName: string;
  homeTeamName: string;
  awayTeamName: string;
}

const mockKboGames: KboGame[] = [
  {
    id: 1,
    date: '2026-07-14',
    time: '14:00',
    stadiumName: '고척스카이돔',
    homeTeamName: '키움',
    awayTeamName: '두산',
  },
  {
    id: 2,
    date: '2026-07-14',
    time: '17:00',
    stadiumName: '잠실야구장',
    homeTeamName: 'LG',
    awayTeamName: '롯데',
  },
  {
    id: 3,
    date: '2026-07-14',
    time: '18:30',
    stadiumName: '대전한화생명볼파크',
    homeTeamName: '한화',
    awayTeamName: 'KIA',
  },
  {
    id: 4,
    date: '2026-07-14',
    time: '18:30',
    stadiumName: 'SSG 랜더스필드',
    homeTeamName: 'SSG',
    awayTeamName: 'NC',
  },
  {
    id: 5,
    date: '2026-07-14',
    time: '18:30',
    stadiumName: 'KT 위즈파크',
    homeTeamName: 'KT',
    awayTeamName: '삼성',
  },
];

function AddTicketScreen() {
  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [seatName, setSeatName] = useState('');

  const canSaveTicket = selectedDate.length > 0 && selectedGameId !== null;

  const selectedDateText = selectedDate ? formatDateText(selectedDate) : '';

  const markedDates = selectedDate
    ? {
        [selectedDate]: {
          selected: true,
          selectedColor: colors.primary,
          selectedTextColor: colors.onPrimary,
        },
      }
    : {};

  const handlePressDay = (day: DateData) => {
    if (selectedDate !== day.dateString) {
      setSelectedGameId(null);
      setSeatName('');
    }

    setSelectedDate(day.dateString);
    setIsCalendarOpen(false);
  };

  const handlePressDateSummary = () => {
    setIsCalendarOpen(true);
  };

  const handlePressGame = (gameId: number) => {
    if (selectedGameId !== gameId) {
      setSeatName('');
    }

    setSelectedGameId(gameId);
  };

  const gamesForSelectedDate = selectedDate
    ? mockKboGames.filter(game => game.date === selectedDate)
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole={'button'}
          accessibilityLabel={'뒤로 가기'}
        >
          <ChevronLeft size={26} color={colors.text} strokeWidth={2.4} />
        </Pressable>

        <AppText style={styles.headerTitle}>티켓 추가</AppText>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>직관 날짜</AppText>
          </View>

          {selectedDate && (
            <View style={styles.dateSummaryCard}>
              <View style={styles.dateSummaryTextArea}>
                <AppText style={styles.dateSummaryLabel}>선택한 날짜</AppText>
                <AppText style={styles.dateSummaryText}>
                  {selectedDateText}
                </AppText>
              </View>

              <InlineActionButton
                label="변경"
                tone="primary"
                onPress={handlePressDateSummary}
                accessibilityLabel="직관 날짜 다시 선택"
              />
            </View>
          )}

          {isCalendarOpen && (
            <AppCalendar
              current={selectedDate || undefined}
              markedDates={markedDates}
              onDayPress={handlePressDay}
            />
          )}

          {selectedDate && !isCalendarOpen && (
            <View style={styles.gameSection}>
              <View style={styles.gameSectionHeader}>
                <AppText style={styles.sectionTitle}>
                  어떤 경기를 봤나요?
                </AppText>
              </View>

              <View style={styles.gameList}>
                {gamesForSelectedDate.length > 0 ? (
                  gamesForSelectedDate.map(game => {
                    const isSelected = selectedGameId === game.id;

                    return (
                      <Pressable
                        key={String(game.id)}
                        style={({ pressed }) => [
                          styles.gameCard,
                          isSelected && styles.gameCardSelected,
                          pressed && styles.gameCardPressed,
                        ]}
                        onPress={() => handlePressGame(game.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`${game.awayTeamName} 원정 대 ${game.homeTeamName} 홈, ${game.time}, ${game.stadiumName}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View style={styles.matchupRow}>
                          <View style={styles.teamSide}>
                            <AppText style={styles.teamRole}>AWAY</AppText>
                            <AppText style={styles.teamName} numberOfLines={1}>
                              {game.awayTeamName}
                            </AppText>
                          </View>

                          <AppText style={styles.vsText}>VS</AppText>

                          <View style={styles.teamSide}>
                            <AppText style={styles.teamRole}>HOME</AppText>
                            <AppText style={styles.teamName} numberOfLines={1}>
                              {game.homeTeamName}
                            </AppText>
                          </View>
                        </View>

                        <View style={styles.gameMetaRow}>
                          <View style={styles.gameMetaContent}>
                            <AppText style={styles.gameTime}>
                              {game.time}
                            </AppText>
                            <View style={styles.metaDot} />
                            <AppText
                              style={styles.stadiumName}
                              numberOfLines={1}
                            >
                              {game.stadiumName}
                            </AppText>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <EmptyCard
                    title="이 날짜에는 경기가 없어요"
                    description="다른 날짜를 선택해 직관 경기를 찾아보세요"
                    style={styles.emptyCard}
                  />
                )}
              </View>
            </View>
          )}

          {selectedGameId && (
            <View style={styles.seatSection}>
              <View style={styles.seatSectionHeader}>
                <AppText style={styles.sectionTitle}>좌석 정보</AppText>
              </View>

              <View style={styles.seatInputCard}>
                <TextInput
                  value={seatName}
                  onChangeText={setSeatName}
                  style={styles.seatInput}
                  placeholder="예: 덕아웃상단석 9블럭 J열"
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="done"
                  clearButtonMode="while-editing"
                  accessibilityLabel="좌석 정보"
                />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={!canSaveTicket}
            style={({ pressed }) => [
              styles.saveButton,
              !canSaveTicket && styles.saveButtonDisabled,
              pressed && canSaveTicket && styles.saveButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSaveTicket }}
          >
            <AppText
              style={[
                styles.saveButtonText,
                !canSaveTicket && styles.saveButtonTextDisabled,
              ]}
            >
              티켓 추가
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AddTicketScreen;

const formatDateText = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

  return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
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
  headerTitle: {
    marginLeft: 2,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  keyboardArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  dateSummaryCard: {
    minHeight: 82,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSummaryTextArea: {
    flex: 1,
  },
  dateSummaryLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.secondary,
  },
  dateSummaryText: {
    marginTop: 6,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  gameSection: {
    marginTop: 12,
  },
  gameSectionHeader: {
    marginBottom: 12,
  },

  gameList: {
    gap: 10,
  },

  gameCard: {
    minHeight: 122,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    gap: 14,
  },
  gameCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  gameCardPressed: {
    opacity: 0.78,
  },
  gameMetaRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameMetaContent: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gameTime: {
    flexShrink: 0,
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.disabled,
  },
  stadiumName: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  matchupRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSide: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 3,
  },
  teamRole: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.secondary,
  },
  teamName: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
  vsText: {
    width: 36,
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.secondary,
    textAlign: 'center',
  },

  seatSection: {
    marginTop: 28,
  },
  seatSectionHeader: {
    marginBottom: 12,
  },
  seatInputCard: {
    minHeight: 58,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  seatInput: {
    minHeight: 46,
    padding: 0,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  emptyCard: {
    minHeight: 156,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  saveButton: {
    height: 54,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
  saveButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
