import type { SportId } from '../ticket/types.ts';
import type { TicketBookCoverPattern } from '../../features/ticket-book/ticketBook.service.ts';

export interface Diary {
  id: string;
  sport: SportId;
  title: string;
  recordCount: number;
  coverColor: string;
  coverPattern: TicketBookCoverPattern;
  coverPhotoPath: string | null;
  photoUri?: string;
}

export interface Bucket {
  id: number;
  title: string;
  isCompleted: boolean;
}
