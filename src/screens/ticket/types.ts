export type SportId = 'baseball' | 'soccer' | 'basketball' | 'volleyball';

export interface Ticket {
  id: number;
  matchDate: string;
  matchTime: string;
  stadiumName: string;
  seatName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  barcodeValue?: string;
}
