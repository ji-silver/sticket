import type { SportId } from '../../features/ticket/types.ts';
import type { TicketBookCoverPattern } from '../../features/ticket-book/types.ts';
import type { BucketItem } from '../../features/bucket-list/types.ts';

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
