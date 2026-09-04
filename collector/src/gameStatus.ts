import type { KboGameStatus } from './types.ts';

export function parseGameStatus(
  gameDate: string,
  today: string,
  time: string,
  relay: string,
  note: string,
  awayScore: number | null,
  homeScore: number | null,
): KboGameStatus {
  const statusText = `${time} ${relay} ${note}`;

  if (statusText.includes('연기')) return 'POSTPONED';
  if (statusText.includes('취소')) return 'CANCELLED';
  if (relay.includes('리뷰')) return 'FINISHED';

  const hasScores = awayScore !== null && homeScore !== null;

  if (gameDate < today) return hasScores ? 'FINISHED' : 'UNKNOWN';
  if (hasScores) return 'IN_PROGRESS';

  return 'SCHEDULED';
}
