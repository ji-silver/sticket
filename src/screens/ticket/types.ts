export type SportId = 'baseball' | 'soccer' | 'basketball' | 'volleyball';

export type BaseballPosition =
  | 'P'
  | 'C'
  | '1B'
  | '2B'
  | '3B'
  | 'SS'
  | 'LF'
  | 'CF'
  | 'RF'
  | 'DH';

export interface LineupPlayer {
  battingOrder: number;
  position: BaseballPosition;
  playerName: string;
}

export interface Ticket {
  id: string;
  matchDate: string;
  matchTime: string;
  stadiumName: string;

  seatName: string | null;
  rating: number | null;
  memo: string | null;
  foods: string[];

  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  isCancelled: boolean;
  awayLineup: LineupPlayer[];
  homeLineup: LineupPlayer[];
  barcodeValue?: string;
  originalTicketImageUri?: string;
}
