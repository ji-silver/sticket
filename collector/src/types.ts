export type KboTeamId =
  | 'ssg'
  | 'sk'
  | 'lg'
  | 'doosan'
  | 'kia'
  | 'samsung'
  | 'lotte'
  | 'hanwha'
  | 'kiwoom'
  | 'nexen'
  | 'kt'
  | 'nc';

export type KboSeriesType = 'PRESEASON' | 'REGULAR' | 'POSTSEASON';

export type KboGameStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELLED'
  | 'POSTPONED'
  | 'UNKNOWN';

export interface KboLineupPlayer {
  battingOrder: number;
  position: string;
  playerName: string;
}

export interface KboGame {
  gameKey: string;
  sourceGameId: string | null;
  season: number;
  seriesType: KboSeriesType;
  gameDate: string;
  startTime: string;
  awayTeamId: KboTeamId;
  homeTeamId: KboTeamId;
  awayScore: number | null;
  homeScore: number | null;
  stadiumName: string;
  status: KboGameStatus;
  cancellationReason: string | null;
}
