import type { KboGameStatus } from './types.ts';

const koreaTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function parseGameStatus(
  gameDate: string,
  today: string,
  time: string,
  relay: string,
  note: string,
  awayScore: number | null,
  homeScore: number | null,
  currentTime = koreaTimeFormatter.format(new Date()),
): KboGameStatus {
  const statusText = `${time} ${relay} ${note}`;

  if (statusText.includes('연기')) return 'POSTPONED';
  if (statusText.includes('취소')) return 'CANCELLED';
  if (relay.includes('리뷰')) return 'FINISHED';
  if (gameDate === today && /^\d{2}:\d{2}$/.test(time) && currentTime < time) {
    return 'SCHEDULED';
  }

  const hasScores = awayScore !== null && homeScore !== null;

  if (gameDate < today) return hasScores ? 'FINISHED' : 'UNKNOWN';
  if (hasScores) return 'IN_PROGRESS';

  return 'SCHEDULED';
}
