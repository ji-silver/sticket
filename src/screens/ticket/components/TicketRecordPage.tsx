import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AppSnackbar from '../../../components/common/AppSnackbar.tsx';
import AppText from '../../../components/common/AppText.tsx';
import { useAuth } from '../../../features/auth/AuthProvider.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';
import type { Ticket } from '../types.ts';
import TicketReviewSection from './TicketReviewSection.tsx';
import TicketVisitInfoSection from './TicketVisitInfoSection.tsx';

interface TicketRecordPageProps {
  ticket: Ticket;
}

type MatchResult = 'win' | 'lose' | 'draw';

const matchResultLabels: Record<MatchResult, string> = {
  win: '승리',
  lose: '패배',
  draw: '무승부',
};

const teamColors: Record<string, string> = {
  키움: '#570514',
  LG: '#C30452',
  한화: '#FC4E00',
  SSG: '#CE0E2D',
  삼성: '#074CA1',
  NC: '#315288',
  KT: '#000000',
  롯데: '#041E42',
  KIA: '#EA0029',
  두산: '#1A1748',
};

function TicketRecordPage({ ticket }: TicketRecordPageProps) {
  const { profile } = useAuth();
  const favoriteTeamName = profile?.favorite_team?.short_name;
  const matchDateText = formatMatchDate(ticket.matchDate);
  const awayScoreText = ticket.awayScore ?? '-';
  const homeScoreText = ticket.homeScore ?? '-';
  const matchResult = favoriteTeamName
    ? getFavoriteTeamMatchResult(ticket, favoriteTeamName)
    : null;
  const matchResultText = matchResult ? matchResultLabels[matchResult] : null;
  const matchResultBadgeStyle =
    matchResult === 'lose'
      ? styles.matchResultBadgeLose
      : matchResult === 'draw'
      ? styles.matchResultBadgeDraw
      : null;
  const matchResultTextStyle =
    matchResult === 'lose'
      ? styles.matchResultTextLose
      : matchResult === 'draw'
      ? styles.matchResultTextDraw
      : null;
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const snackbarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (snackbarTimeout.current) {
        clearTimeout(snackbarTimeout.current);
      }
    },
    [],
  );

  const showSnackbar = (message: string) => {
    if (snackbarTimeout.current) {
      clearTimeout(snackbarTimeout.current);
    }

    setSnackbarMessage(message);
    snackbarTimeout.current = setTimeout(() => setSnackbarMessage(null), 3000);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.matchSummary}>
          <AppText style={styles.matchMeta} numberOfLines={1}>
            {matchDateText} · {ticket.matchTime} · {ticket.stadiumName}
          </AppText>

          <View
            style={styles.scoreBoard}
            accessible
            accessibilityLabel={`원정 ${
              ticket.awayTeamName
            } ${awayScoreText} 대 홈 ${ticket.homeTeamName} ${homeScoreText}${
              matchResultText && favoriteTeamName
                ? `, 응원 구단 ${favoriteTeamName} 기준 ${matchResultText}`
                : ''
            }`}
          >
            <View style={styles.teamSide}>
              <AppText
                style={[
                  styles.teamRole,
                  {
                    color:
                      teamColors[ticket.awayTeamName] ?? colors.textSecondary,
                  },
                ]}
              >
                AWAY
              </AppText>

              <AppText style={styles.teamName} numberOfLines={1}>
                {ticket.awayTeamName}
              </AppText>
            </View>

            <View style={styles.scoreCenter}>
              <View style={styles.scoreRow}>
                <AppText style={styles.scoreText}>{awayScoreText}</AppText>
                <AppText style={styles.scoreDivider}>:</AppText>
                <AppText style={styles.scoreText}>{homeScoreText}</AppText>
              </View>
            </View>

            <View style={styles.teamSide}>
              <AppText
                style={[
                  styles.teamRole,
                  {
                    color:
                      teamColors[ticket.homeTeamName] ?? colors.textSecondary,
                  },
                ]}
              >
                HOME
              </AppText>

              <AppText style={styles.teamName} numberOfLines={1}>
                {ticket.homeTeamName}
              </AppText>
            </View>
          </View>

          {matchResultText ? (
            <View style={[styles.matchResultBadge, matchResultBadgeStyle]}>
              <AppText
                style={[styles.matchResultText, matchResultTextStyle]}
                numberOfLines={1}
              >
                {matchResultText}
              </AppText>
            </View>
          ) : null}
        </View>

        <TicketVisitInfoSection
          ticketId={ticket.id}
          initialSeatName={ticket.seatName}
          initialOriginalTicketImageUri={ticket.originalTicketImageUri}
          onFeedback={showSnackbar}
        />

        <TicketReviewSection
          ticketId={ticket.id}
          initialRating={ticket.rating}
          initialMemo={ticket.memo}
          initialFoods={ticket.foods}
        />
      </ScrollView>

      {snackbarMessage ? (
        <AppSnackbar message={snackbarMessage} horizontalInset={24} />
      ) : null}
    </KeyboardAvoidingView>
  );
}

export default TicketRecordPage;

function formatMatchDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');

  return `${monthText}.${dayText} ${weekday}`;
}

function getFavoriteTeamMatchResult(
  ticket: Ticket,
  favoriteTeamName: string,
): MatchResult | null {
  if (ticket.awayScore === null || ticket.homeScore === null) {
    return null;
  }

  const isAwayTeam = ticket.awayTeamName === favoriteTeamName;
  const isHomeTeam = ticket.homeTeamName === favoriteTeamName;

  if (!isAwayTeam && !isHomeTeam) return null;
  if (ticket.awayScore === ticket.homeScore) return 'draw';

  const favoriteTeamScore = isAwayTeam ? ticket.awayScore : ticket.homeScore;
  const opponentScore = isAwayTeam ? ticket.homeScore : ticket.awayScore;

  return favoriteTeamScore > opponentScore ? 'win' : 'lose';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  matchSummary: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  matchMeta: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scoreBoard: {
    minHeight: 56,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSide: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 4,
  },
  teamRole: {
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  teamName: {
    maxWidth: '100%',
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
  scoreCenter: {
    width: 104,
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    minWidth: 28,
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fonts.black,
    color: colors.text,
    textAlign: 'center',
  },
  scoreDivider: {
    marginHorizontal: 7,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.disabled,
  },
  matchResultBadge: {
    maxWidth: '100%',
    minHeight: 22,
    marginTop: 2,
    paddingHorizontal: 9,
    borderRadius: 11,
    borderCurve: 'continuous',
    backgroundColor: colors.primarySoft,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchResultText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  matchResultBadgeLose: {
    backgroundColor: '#FDECEC',
  },
  matchResultTextLose: {
    color: '#C44D4D',
  },
  matchResultBadgeDraw: {
    backgroundColor: '#F0F1F2',
  },
  matchResultTextDraw: {
    color: colors.textSecondary,
  },
});
