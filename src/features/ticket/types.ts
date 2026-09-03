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
  pageOrientation: TicketDiaryOrientation | null;
  matchDate: string;
  matchTime: string;
  stadiumName: string;

  seatName: string | null;
  seatDetail: string | null;
  rating: number | null;
  memo: string | null;
  foods: string[];

  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  gameStatus: string;
  isCancelled: boolean;
  awayLineup: LineupPlayer[];
  homeLineup: LineupPlayer[];
  barcodeValue?: string;
  originalTicketImageUri?: string;
}

export const TICKET_DIARY_VERSION = 1 as const;

export type TicketDiaryPaperType = 'plain' | 'grid' | 'lined';

export type TicketDiaryOrientation = 'portrait' | 'landscape';

export type TicketDiaryMatrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export type TicketDiaryFontId =
  | 'pretendard'
  | 'corncorn'
  | 'yuntaeng'
  | 'bookkMyungjo'
  | 'kyobo2025';

export interface SavedDiaryPhoto {
  id: string;
  storagePath: string;
  width: number;
  height: number;
  sourceWidth?: number;
  sourceHeight?: number;
  matrix: TicketDiaryMatrix;
}

export interface SavedDiarySticker {
  id: string;
  stickerId: string;
  width: number;
  height: number;
  matrix: TicketDiaryMatrix;
}

export interface SavedDiaryTextStyle {
  color: string;
  fontSize: number;
  align: 'left' | 'center' | 'right';
  isBold: boolean;
  hasUnderline: boolean;
  hasStrikeThrough: boolean;
  fontId?: TicketDiaryFontId;
}

export interface SavedDiaryText {
  id: string;
  text: string;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  style: SavedDiaryTextStyle;
}

export type SavedDiaryItem =
  | {
      type: 'photo';
      data: SavedDiaryPhoto;
    }
  | {
      type: 'sticker';
      data: SavedDiarySticker;
    }
  | {
      type: 'text';
      data: SavedDiaryText;
    };

export interface TicketDiaryData {
  version: typeof TICKET_DIARY_VERSION;
  orientation: TicketDiaryOrientation;
  paperType: TicketDiaryPaperType;
  items: SavedDiaryItem[];
  drawingIndex: number;
  drawingPath: string | null;
}
