export type SportId = 'baseball' | 'soccer' | 'basketball' | 'volleyball';

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
  barcodeValue?: string;
  originalTicketImageUri?: string;
}
