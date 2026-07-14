import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarX, Check, ChevronLeft } from 'lucide-react-native';
import AppText from '../../components/common/AppText.tsx';
import { fonts } from '../../styles/fonts.ts';
import { useNavigation } from '@react-navigation/core';
import { useMemo, useState } from 'react';
import AppCalendar from '../../components/common/AppCalendar.tsx';
import { DateData } from 'react-native-calendars';
import { colors } from '../../styles/colors.ts';

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

  const selectedDateText = useMemo(() => {
    if (!selectedDate) return '';

    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

    return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
  }, [selectedDate]);

  const markedDates = useMemo(() => {
    if (!selectedDate) return {};

    return {
      [selectedDate]: {
        selected: true,
        selectedColor: colors.primary,
        selectedTextColor: colors.onPrimary,
      },
    };
  }, [selectedDate]);

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

  const gamesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    return mockKboGames.filter(game => game.date === selectedDate);
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>직관 날짜</AppText>
        </View>

        {selectedDate && (
          <Pressable
            style={styles.dateSummaryCard}
            onPress={handlePressDateSummary}
            accessibilityRole={'button'}
            accessibilityLabel={'직관 날짜 다시 선택'}
          >
            <View>
              <AppText style={styles.dateSummaryLabel}>선택한 날짜</AppText>
              <AppText style={styles.dateSummaryText}>
                {selectedDateText}
              </AppText>
            </View>
            <AppText style={styles.changeButtonText}>변경</AppText>
          </Pressable>
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
              <AppText style={styles.sectionTitle}>어떤 경기를 봤나요?</AppText>
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
                      <View style={styles.gameMetaRow}>
                        <View style={styles.gameMetaContent}>
                          <View
                            style={[
                              styles.timeBadge,
                              isSelected && styles.timeBadgeSelected,
                            ]}
                          >
                            <AppText
                              style={[
                                styles.gameTime,
                                isSelected && styles.gameTimeSelected,
                              ]}
                            >
                              {game.time}
                            </AppText>
                          </View>

                          <AppText style={styles.stadiumName} numberOfLines={1}>
                            {game.stadiumName}
                          </AppText>
                        </View>

                        <View
                          style={[
                            styles.selectionIndicator,
                            isSelected && styles.selectionIndicatorSelected,
                          ]}
                        >
                          {isSelected && (
                            <Check
                              size={13}
                              color={colors.onPrimary}
                              strokeWidth={3}
                            />
                          )}
                        </View>
                      </View>

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
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptyGameCard}>
                  <View style={styles.emptyGameIcon}>
                    <CalendarX size={22} color="#777777" strokeWidth={2} />
                  </View>

                  <View style={styles.emptyGameTextGroup}>
                    <AppText style={styles.emptyGameTitle}>
                      이 날짜에는 경기가 없어요
                    </AppText>
                    <AppText style={styles.emptyGameDescription}>
                      다른 날짜를 선택해 직관 경기를 찾아보세요
                    </AppText>
                  </View>
                </View>
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
                placeholder={'예: 덕아웃상단석 9블럭 J열'}
                placeholderTextColor={'#B0B0B0'}
                returnKeyType={'done'}
              />
            </View>
          </View>
        )}

        {selectedGameId && (
          <Pressable
            disabled={!canSaveTicket}
            style={[
              styles.saveButton,
              !canSaveTicket && styles.saveButtonDisabled,
            ]}
            accessibilityRole={'button'}
          >
            <AppText style={styles.saveButtonText}>티켓 추가</AppText>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default AddTicketScreen;

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

  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  dateSummaryCard: {
    minHeight: 82,
    marginBottom: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#F7F7F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSummaryLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#9A9A9A',
  },
  dateSummaryText: {
    marginTop: 6,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  changeButtonText: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: colors.primary,
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
  gameSection: {
    marginTop: 28,
  },
  gameSectionHeader: {
    marginBottom: 12,
  },

  gameList: {
    gap: 10,
  },

  emptyGameCard: {
    minHeight: 210,
    padding: 28,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  emptyGameIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyGameTextGroup: {
    alignItems: 'center',
    gap: 6,
  },

  emptyGameTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#333333',
    textAlign: 'center',
  },

  emptyGameDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: '#777777',
    textAlign: 'center',
  },

  gameCard: {
    minHeight: 112,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#ECECEC',
    backgroundColor: '#FFFFFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  gameMetaContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBadge: {
    flexShrink: 0,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#F2F2F2',
  },
  timeBadgeSelected: {
    backgroundColor: colors.primary,
  },
  gameTime: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#555555',
  },
  gameTimeSelected: {
    color: colors.onPrimary,
  },
  stadiumName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#666666',
  },
  selectionIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  matchupRow: {
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
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#777777',
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
    color: '#777777',
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
    borderColor: '#ECECEC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  seatInput: {
    minHeight: 46,
    padding: 0,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  saveButton: {
    height: 52,
    marginTop: 30,
    borderRadius: 26,
    borderCurve: 'continuous',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.onPrimary,
  },
});
