import { decode } from 'base64-arraybuffer';
import { Json } from '../../lib/database.types.ts';
import { supabase } from '../../lib/supabase.ts';
import { SavedDiaryItem, TICKET_DIARY_VERSION, TicketDiaryData } from './types';

const TICKET_DIARY_BUCKET = 'ticket-diaries';
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;

async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('로그인 정보를 확인할 수 없습니다.');
  }

  return user.id;
}

function readBlobAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(reader.error ?? new Error('그림 파일을 읽을 수 없습니다.'));
    };

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('그림 파일 형식을 확인할 수 없습니다.'));
        return;
      }

      const base64Separator = reader.result.indexOf(',');

      if (base64Separator === -1) {
        reject(new Error('그림 파일 형식을 확인할 수 없습니다.'));
        return;
      }

      resolve(reader.result.slice(base64Separator + 1));
    };

    reader.readAsDataURL(blob);
  });
}

export function createEmptyTicketDiaryData(): TicketDiaryData {
  return {
    version: TICKET_DIARY_VERSION,
    paperType: 'plain',
    items: [],
    drawingIndex: 0,
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

  const savedItems = value.items as SavedDiaryItem[];

  if (
    typeof value.drawingIndex === 'number' &&
    Number.isInteger(value.drawingIndex)
  ) {
    return {
      ...(value as unknown as TicketDiaryData),
      drawingIndex: Math.min(
        savedItems.length,
        Math.max(0, value.drawingIndex),
      ),
    };
  }

  // 기존 다이어리가 보여주던 순서(사진 → 드로잉 → 스티커·텍스트)를 유지합니다.
  const photos = savedItems.filter(item => item.type === 'photo');
  const foregroundItems = savedItems.filter(item => item.type !== 'photo');

  return {
    ...(value as unknown as TicketDiaryData),
    items: [...photos, ...foregroundItems],
    drawingIndex: photos.length,
  };
}

function belongsToTicket(storagePath: string, ticketId: string): boolean {
  return storagePath.split('/')[1] === ticketId;
}

export function getTicketDiaryFilePaths(
  value: unknown,
  ticketId: string,
): string[] {
  const diaryData = parseTicketDiaryData(value);
  const photoPaths = diaryData.items.flatMap(item =>
    item.type === 'photo' && belongsToTicket(item.data.storagePath, ticketId)
      ? [item.data.storagePath]
      : [],
  );

  return diaryData.drawingPath &&
    belongsToTicket(diaryData.drawingPath, ticketId)
    ? [...photoPaths, diaryData.drawingPath]
    : photoPaths;
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

  const diaryData = parseTicketDiaryData(data.diary_data);

  return {
    ...diaryData,
    items: diaryData.items.filter(
      item =>
        item.type !== 'photo' ||
        belongsToTicket(item.data.storagePath, ticketId),
    ),
    drawingPath:
      diaryData.drawingPath && belongsToTicket(diaryData.drawingPath, ticketId)
        ? diaryData.drawingPath
        : null,
  };
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

export async function uploadTicketDiaryPhoto(
  ticketId: string,
  photoId: string,
  photoBase64: string,
): Promise<string> {
  if (photoBase64.length === 0) {
    throw new Error('업로드할 사진 데이터가 없습니다.');
  }

  const userId = await getAuthenticatedUserId();
  const photoPath = `${userId}/${ticketId}/photos/${photoId}.jpg`;

  const { data, error } = await supabase.storage
    .from(TICKET_DIARY_BUCKET)
    .upload(photoPath, decode(photoBase64), {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return data.path;
}

export async function uploadTicketDiaryDrawing(
  ticketId: string,
  drawingBase64: string,
): Promise<string> {
  if (drawingBase64.length === 0) {
    throw new Error('업로드할 그림 데이터가 없습니다.');
  }

  const userId = await getAuthenticatedUserId();
  const drawingPath = `${userId}/${ticketId}/drawing/drawing.data`;

  const { data, error } = await supabase.storage
    .from(TICKET_DIARY_BUCKET)
    .upload(drawingPath, decode(drawingBase64), {
      contentType: 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return data.path;
}

export async function getTicketDiaryDrawingBase64(
  drawingPath: string,
): Promise<string> {
  if (drawingPath.trim().length === 0) {
    throw new Error('불러올 그림 경로가 없습니다.');
  }

  const { data, error } = await supabase.storage
    .from(TICKET_DIARY_BUCKET)
    .download(drawingPath);

  if (error) {
    throw error;
  }

  return readBlobAsBase64(data);
}

export async function getTicketDiaryPhotoUrls(
  storagePaths: string[],
): Promise<Map<string, string>> {
  const uniquePaths = Array.from(new Set(storagePaths));

  if (uniquePaths.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase.storage
    .from(TICKET_DIARY_BUCKET)
    .createSignedUrls(uniquePaths, SIGNED_URL_EXPIRES_IN_SECONDS);

  if (error) {
    throw error;
  }

  const signedUrlByPath = new Map<string, string>();

  data.forEach(photo => {
    if (photo.path && photo.signedUrl) {
      signedUrlByPath.set(photo.path, photo.signedUrl);
    }
  });

  return signedUrlByPath;
}

// 스토리지 파일 삭제
export async function removeTicketDiaryFiles(
  storagePaths: string[],
): Promise<void> {
  const uniquePaths = Array.from(new Set(storagePaths));

  if (uniquePaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage
    .from(TICKET_DIARY_BUCKET)
    .remove(uniquePaths);

  if (error) {
    throw error;
  }
}
