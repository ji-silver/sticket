export type SportId = 'baseball' | 'soccer' | 'basketball' | 'volleyball';

export interface Ticket {
  id: string;
  matchDate: string;
  matchTime: string;
  stadiumName: string;
  seatName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  barcodeValue?: string;
  originalTicketImageUri?: string;
}
