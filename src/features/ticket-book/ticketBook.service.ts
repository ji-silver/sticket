import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';
import {
  getTicketDiaryFilePaths,
  removeTicketDiaryFiles,
} from '../ticket/ticketDiary.service';
import { TicketBook, TicketBookCoverPattern, TicketBookSport } from './types';

const COVER_BUCKET = 'ticket-book-covers';
const ORIGINAL_TICKET_BUCKET = 'ticket-originals';
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;

interface CreateTicketBookParams {
  sport: TicketBookSport;
  coverColor: string;
  coverPattern: TicketBookCoverPattern;
  coverImageBase64?: string;
}

interface UpdateTicketBookParams {
  ticketBookId: string;
  coverColor: string;
  coverPattern: TicketBookCoverPattern;
  // undefined는 기존 사진 유지, null은 사진 제거, 문자열은 새 사진으로 교체한다.
  coverImageBase64?: string | null;
}

interface UploadTicketBookCoverParams {
  userId: string;
  ticketBookId: string;
  base64: string;
}

async function getAuthenticatedUser() {
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

  return user;
}

async function uploadTicketBookCover({
  userId,
  ticketBookId,
  base64,
}: UploadTicketBookCoverParams) {
  const filePath = `${userId}/${ticketBookId}/cover.jpg`;

  const { data, error } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(filePath, decode(base64), {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return data.path;
}

async function createCoverSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(COVER_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN_SECONDS);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function createTicketBook({
  sport,
  coverColor,
  coverPattern,
  coverImageBase64,
}: CreateTicketBookParams) {
  const user = await getAuthenticatedUser();

  const { data: createdTicketBook, error: createError } = await supabase
    .from('ticket_books')
    .insert({
      user_id: user.id,
      sport,
      cover_color: coverColor,
      cover_pattern: coverPattern,
      cover_photo_path: null,
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  if (!coverImageBase64) {
    return createdTicketBook;
  }

  let uploadedPath: string | null = null;

  try {
    uploadedPath = await uploadTicketBookCover({
      userId: user.id,
      ticketBookId: createdTicketBook.id,
      base64: coverImageBase64,
    });

    const { data: updatedTicketBook, error: updateError } = await supabase
      .from('ticket_books')
      .update({
        cover_photo_path: uploadedPath,
      })
      .eq('id', createdTicketBook.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedTicketBook;
  } catch (error) {
    if (uploadedPath) {
      await supabase.storage.from(COVER_BUCKET).remove([uploadedPath]);
    }

    await supabase
      .from('ticket_books')
      .delete()
      .eq('id', createdTicketBook.id)
      .eq('user_id', user.id);

    throw error;
  }
}

export async function getTicketBooks(): Promise<TicketBook[]> {
  const user = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from('ticket_books')
    .select(
      `
    id,
    sport,
    cover_color,
    cover_pattern,
    cover_photo_path,
    created_at,
    tickets(count)
  `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return Promise.all(
    data.map(async ticketBook => {
      if (ticketBook.sport !== 'baseball') {
        throw new Error('지원하지 않는 스포츠 티켓북입니다.');
      }

      if (
        ticketBook.cover_pattern !== 'solid' &&
        ticketBook.cover_pattern !== 'stripe'
      ) {
        throw new Error('지원하지 않는 티켓북 표지 패턴입니다.');
      }

      const coverPhotoUrl = ticketBook.cover_photo_path
        ? await createCoverSignedUrl(ticketBook.cover_photo_path)
        : null;

      return {
        id: ticketBook.id,
        sport: ticketBook.sport,
        recordCount: ticketBook.tickets[0]?.count ?? 0,
        coverColor: ticketBook.cover_color,
        coverPattern: ticketBook.cover_pattern,
        coverPhotoPath: ticketBook.cover_photo_path,
        coverPhotoUrl,
      };
    }),
  );
}

export async function updateTicketBook({
  ticketBookId,
  coverColor,
  coverPattern,
  coverImageBase64,
}: UpdateTicketBookParams) {
  const user = await getAuthenticatedUser();
  let previousCoverPath: string | null = null;
  if (coverImageBase64 === null) {
    const { data: currentBook, error: readError } = await supabase
      .from('ticket_books')
      .select('cover_photo_path')
      .eq('id', ticketBookId)
      .eq('user_id', user.id)
      .single();
    if (readError) throw readError;
    previousCoverPath = currentBook.cover_photo_path;
  }

  const coverPhotoPath =
    coverImageBase64 === null
      ? null
      : coverImageBase64
      ? await uploadTicketBookCover({
          userId: user.id,
          ticketBookId,
          base64: coverImageBase64,
        })
      : undefined;

  const { data, error } = await supabase
    .from('ticket_books')
    .update({
      cover_color: coverColor,
      cover_pattern: coverPattern,
      ...(coverPhotoPath !== undefined
        ? { cover_photo_path: coverPhotoPath }
        : {}),
    })
    .eq('id', ticketBookId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // DB 저장 실패 시 사진을 잃지 않도록 연결 해제 후 파일을 정리한다.
  // 파일 정리 실패는 저장 성공을 되돌리지 않으며 다음 업로드가 같은 경로를 덮어쓴다.
  if (previousCoverPath) {
    try {
      const { error: removeError } = await supabase.storage
        .from(COVER_BUCKET)
        .remove([previousCoverPath]);
      if (removeError) throw removeError;
    } catch (removeError) {
      console.error('제거한 포토카드 파일을 정리하지 못했습니다.', removeError);
    }
  }

  return data;
}

export async function deleteTicketBook(ticketBookId: string) {
  const user = await getAuthenticatedUser();

  const { data: tickets, error: ticketError } = await supabase
    .from('tickets')
    .select('id, original_photo_path, diary_data')
    .eq('ticket_book_id', ticketBookId);

  if (ticketError) {
    throw ticketError;
  }

  const diaryFilePaths = tickets.flatMap(ticket =>
    getTicketDiaryFilePaths(ticket.diary_data, ticket.id),
  );

  const { data, error } = await supabase
    .from('ticket_books')
    .delete()
    .eq('id', ticketBookId)
    .eq('user_id', user.id)
    .select('cover_photo_path')
    .single();

  if (error) {
    throw error;
  }

  const originalPhotoPaths = tickets.flatMap(ticket =>
    ticket.original_photo_path ? [ticket.original_photo_path] : [],
  );

  if (originalPhotoPaths.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(ORIGINAL_TICKET_BUCKET)
      .remove(originalPhotoPaths);

    if (removeError) {
      console.error('원본 티켓 사진을 정리하지 못했습니다.', removeError);
    }
  }

  try {
    await removeTicketDiaryFiles(diaryFilePaths);
  } catch (removeError) {
    console.error('티켓 다이어리 파일을 정리하지 못했습니다.', removeError);
  }

  if (data.cover_photo_path) {
    const { error: removeError } = await supabase.storage
      .from(COVER_BUCKET)
      .remove([data.cover_photo_path]);

    if (removeError) {
      console.error('티켓북 표지 이미지를 정리하지 못했습니다.', removeError);
    }
  }
}
