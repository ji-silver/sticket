import type { SportId } from '../ticket/types.ts';
import type { TicketBookCoverPattern } from '../../features/ticket-book/ticketBook.service.ts';
import type { BucketItem } from '../../features/bucket-list/bucketList.service.ts';

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

export type Bucket = BucketItem;
