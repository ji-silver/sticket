import { supabase } from '../../lib/supabase.ts';
import { Json } from '../../lib/database.types.ts';

export const TICKET_DIARY_VERSION = 1 as const;

export type TicketDiaryPaperType = 'plain' | 'grid';

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

export interface SavedDiaryPhoto {
  id: string;

  // file:// 로컬 경로가 아닌 Supabase Storage 내부 경로
  storagePath: string;

  width: number;
  height: number;
  matrix: TicketDiaryMatrix;
}

export interface SavedDiarySticker {
  id: string;

  // require()의 숫자 값 대신 스티커 고유 ID만 저장
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
  paperType: TicketDiaryPaperType;
  items: SavedDiaryItem[];
  drawingPath: string | null;
}

export function createEmptyTicketDiaryData(): TicketDiaryData {
  return {
    version: TICKET_DIARY_VERSION,
    paperType: 'plain',
    items: [],
    drawingPath: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTicketDiaryData(value: unknown): TicketDiaryData {
  if (
    !isRecord(value) ||
    value.version !== TICKET_DIARY_VERSION ||
    (value.paperType !== 'plain' && value.paperType !== 'grid') ||
    !Array.isArray(value.items) ||
    (value.drawingPath !== null && typeof value.drawingPath !== 'string')
  ) {
    throw new Error('저장된 다이어리 형식을 확인할 수 없습니다.');
  }

  return value as unknown as TicketDiaryData;
}

export async function getTicketDiaryData(
  ticketId: string,
): Promise<TicketDiaryData> {
  const { data, error } = await supabase
    .from('tickets')
    .select('diary_data')
    .eq('id', ticketId)
    .single();

  if (error) {
    throw error;
  }

  return parseTicketDiaryData(data.diary_data);
}

export async function updateTicketDiaryData(
  ticketId: string,
  diaryData: TicketDiaryData,
): Promise<TicketDiaryData> {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      diary_data: diaryData as unknown as Json,
    })
    .eq('id', ticketId)
    .select('diary_data')
    .single();

  if (error) {
    throw error;
  }

  return parseTicketDiaryData(data.diary_data);
}
