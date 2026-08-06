export type TicketBookSport = 'baseball';

export type TicketBookCoverPattern = 'solid' | 'stripe';

export interface TicketBook {
  id: string;
  sport: TicketBookSport;
  recordCount: number;
  coverPattern: TicketBookCoverPattern;
  coverColor: string;
  coverPhotoPath: string | null;
  coverPhotoUrl: string | null;
}
