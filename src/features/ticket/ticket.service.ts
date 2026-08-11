import { decode } from 'base64-arraybuffer';

import { supabase } from '../../lib/supabase.ts';
import { getTodayInKorea } from '../../lib/date.ts';
import type {
  BaseballPosition,
  LineupPlayer,
  Ticket,
  TicketDiaryOrientation,
} from './types';
import {
  getTicketDiaryFilePaths,
  removeTicketDiaryFiles,
} from './ticketDiary.service.ts';

const ORIGINAL_TICKET_BUCKET = 'ticket-originals';
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60; // 유효시간 1시간
const MAX_SEAT_NAME_LENGTH = 100;
const MAX_MEMO_LENGTH = 300;
const MAX_FOOD_COUNT = 10;
const BASEBALL_POSITIONS: BaseballPosition[] = [
  'P',
  'C',
  '1B',
  '2B',
  '3B',
  'SS',
  'LF',
  'CF',
  'RF',
  'DH',
];

interface CreateTicketParams {
  gameKey: string;
  seatName: string;
  originalPhotoBase64?: string;
}

export async function createTicket({
  gameKey,
  seatName,
  originalPhotoBase64,
}: CreateTicketParams) {
  const normalizedSeatName = seatName.trim();

  if (normalizedSeatName.length > MAX_SEAT_NAME_LENGTH) {
    throw new Error(
      `좌석 정보는 ${MAX_SEAT_NAME_LENGTH}자 이하로 입력해 주세요.`,
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('로그인 정보를 확인할 수 없습니다.');
  }

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('game_date')
    .eq('game_key', gameKey)
    .single();

  if (gameError) {
    throw gameError;
  }

  if (game.game_date > getTodayInKorea()) {
    throw new Error('미래 경기는 티켓으로 등록할 수 없습니다.');
  }

  const { data: ticketBook, error: ticketBookError } = await supabase
    .from('ticket_books')
    .select('id')
    .eq('user_id', user.id)
    .eq('sport', 'baseball')
    .maybeSingle();

  if (ticketBookError) {
    throw ticketBookError;
  }

  if (!ticketBook) {
    throw new Error('야구 티켓북을 찾을 수 없습니다.');
  }

  const { data: createdTicket, error: createError } = await supabase
    .from('tickets')
    .insert({
      ticket_book_id: ticketBook.id,
      game_key: gameKey,
      seat_name: normalizedSeatName || null,
      original_photo_path: null,
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  if (!originalPhotoBase64) {
    return createdTicket;
  }

  let uploadedPhotoPath: string | null = null;

  try {
    const photoPath = `${user.id}/${ticketBook.id}/${createdTicket.id}/original.jpg`;

    const { data: uploadedPhoto, error: uploadError } = await supabase.storage
      .from(ORIGINAL_TICKET_BUCKET)
      .upload(photoPath, decode(originalPhotoBase64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    uploadedPhotoPath = uploadedPhoto.path;

    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update({
        original_photo_path: uploadedPhotoPath,
      })
      .eq('id', createdTicket.id)
      .eq('ticket_book_id', ticketBook.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedTicket;
  } catch (error) {
    if (uploadedPhotoPath) {
      const { error: removeError } = await supabase.storage
        .from(ORIGINAL_TICKET_BUCKET)
        .remove([uploadedPhotoPath]);

      if (removeError) {
        console.error(
          '업로드한 원본 티켓 사진을 정리하지 못했습니다.',
          removeError,
        );
      }
    }

    const { error: rollbackError } = await supabase
      .from('tickets')
      .delete()
      .eq('id', createdTicket.id)
      .eq('ticket_book_id', ticketBook.id);

    if (rollbackError) {
      console.error('생성 중인 티켓을 정리하지 못했습니다.', rollbackError);
    }

    throw error;
  }
}

// ticket 테이블 조회
// game:games!tickets_game_key_fkey는 tickets 테이블의 game_key 컬럼과 games 테이블의 key 컬럼을 조인하는 것
export async function getTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select(
      `
         id,
        seat_name,
        rating,
        memo,
        foods,
        original_photo_path,
        page_orientation,
        created_at,

        game:games!tickets_game_key_fkey (
          game_date,
          start_time,
          stadium_name,
          status,
          away_lineup,
          home_lineup,
          away_score,
          home_score,
          awayTeam:teams!games_away_team_id_fkey (
            short_name
          ),
          homeTeam:teams!games_home_team_id_fkey (
            short_name
          )
        )
      `,
    )
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  const photoPaths = Array.from(
    new Set(
      data.flatMap(ticket =>
        ticket.original_photo_path ? [ticket.original_photo_path] : [],
      ),
    ),
  );

  const signedUrlByPath = new Map<string, string>();

  if (photoPaths.length > 0) {
    const { data: signedPhotos, error: signedUrlError } = await supabase.storage
      .from(ORIGINAL_TICKET_BUCKET)
      .createSignedUrls(photoPaths, SIGNED_URL_EXPIRES_IN_SECONDS);

    if (signedUrlError) {
      throw signedUrlError;
    }

    signedPhotos.forEach(photo => {
      if (photo.path && photo.signedUrl) {
        signedUrlByPath.set(photo.path, photo.signedUrl);
      }
    });
  }

  return data
    .map(ticket => {
      const game = ticket.game;

      if (!game || !game.awayTeam || !game.homeTeam) {
        throw new Error('경기 또는 구단 정보를 찾을 수 없습니다.');
      }
      return {
        id: ticket.id,
        pageOrientation:
          ticket.page_orientation === 'portrait' ||
          ticket.page_orientation === 'landscape'
            ? (ticket.page_orientation as TicketDiaryOrientation)
            : null,
        matchDate: game.game_date,
        matchTime: game.start_time?.slice(0, 5) ?? '시간 미정',
        stadiumName: game.stadium_name ?? '경기장 미정',
        seatName: ticket.seat_name,
        rating: ticket.rating,
        memo: ticket.memo,
        foods: ticket.foods,
        homeTeamName: game.homeTeam.short_name,
        awayTeamName: game.awayTeam.short_name,
        homeScore: game.home_score,
        awayScore: game.away_score,
        isCancelled: game.status === 'CANCELLED',
        awayLineup: parseLineup(game.away_lineup),
        homeLineup: parseLineup(game.home_lineup),
        originalTicketImageUri: ticket.original_photo_path
          ? signedUrlByPath.get(ticket.original_photo_path)
          : undefined,
      };
    })
    .sort((firstTicket, secondTicket) => {
      const dateComparison = secondTicket.matchDate.localeCompare(
        firstTicket.matchDate,
      );

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return secondTicket.matchTime.localeCompare(firstTicket.matchTime);
    });
}

export async function setTicketPageOrientation(
  ticketId: string,
  orientation: TicketDiaryOrientation,
) {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      page_orientation: orientation,
    })
    .eq('id', ticketId)
    .is('page_orientation', null)
    .select('page_orientation')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.page_orientation) {
    throw new Error('페이지 방향이 이미 설정되어 있습니다.');
  }

  return data.page_orientation as TicketDiaryOrientation;
}

function parseLineup(value: unknown): LineupPlayer[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap(player => {
    if (
      typeof player !== 'object' ||
      player === null ||
      !('battingOrder' in player) ||
      !('position' in player) ||
      !('playerName' in player) ||
      typeof player.battingOrder !== 'number' ||
      typeof player.position !== 'string' ||
      typeof player.playerName !== 'string' ||
      !BASEBALL_POSITIONS.includes(player.position as BaseballPosition)
    ) {
      return [];
    }

    return [
      {
        battingOrder: player.battingOrder,
        position: player.position as BaseballPosition,
        playerName: player.playerName,
      },
    ];
  });
}

export async function updateTicketSeat(ticketId: string, seatName: string) {
  const normalizedSeatName = seatName.trim();

  if (normalizedSeatName.length > MAX_SEAT_NAME_LENGTH) {
    throw new Error(
      `좌석 정보는 ${MAX_SEAT_NAME_LENGTH}자 이하로 입력해 주세요.`,
    );
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({
      seat_name: normalizedSeatName || null,
    })
    .eq('id', ticketId)
    .select('seat_name')
    .single();

  if (error) {
    throw error;
  }

  return data.seat_name;
}

export async function updateTicketRating(
  ticketId: string,
  rating: number | null,
) {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      rating,
    })
    .eq('id', ticketId)
    .select('rating')
    .single();

  if (error) {
    throw error;
  }

  return data.rating;
}

export async function updateTicketMemo(ticketId: string, memo: string) {
  const normalizedMemo = memo.trim();

  if (normalizedMemo.length > MAX_MEMO_LENGTH) {
    throw new Error(`오늘의 기록은 ${MAX_MEMO_LENGTH}자 이하로 입력해 주세요.`);
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({
      memo: normalizedMemo || null,
    })
    .eq('id', ticketId)
    .select('memo')
    .single();

  if (error) {
    throw error;
  }

  return data.memo;
}

export async function updateTicketFoods(ticketId: string, foods: string[]) {
  const normalizedFoods = Array.from(
    new Set(foods.map(food => food.trim()).filter(food => food.length > 0)),
  );

  if (normalizedFoods.length > MAX_FOOD_COUNT) {
    throw new Error(
      `야구 푸드는 최대 ${MAX_FOOD_COUNT}개까지 등록할 수 있습니다.`,
    );
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({
      foods: normalizedFoods,
    })
    .eq('id', ticketId)
    .select('foods')
    .single();

  if (error) {
    throw error;
  }

  return data.foods;
}

async function getTicketOriginalPhoto(ticketId: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select('ticket_book_id, original_photo_path')
    .eq('id', ticketId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateTicketOriginalPhoto(
  ticketId: string,
  originalPhotoBase64: string,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('로그인 정보를 확인할 수 없습니다.');
  }

  const ticket = await getTicketOriginalPhoto(ticketId);
  const photoPath = `${user.id}/${
    ticket.ticket_book_id
  }/${ticketId}/original-${Date.now()}.jpg`;

  const { data: uploadedPhoto, error: uploadError } = await supabase.storage
    .from(ORIGINAL_TICKET_BUCKET)
    .upload(photoPath, decode(originalPhotoBase64), {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  let isCommitted = false;

  try {
    const { data: signedPhoto, error: signedUrlError } = await supabase.storage
      .from(ORIGINAL_TICKET_BUCKET)
      .createSignedUrl(uploadedPhoto.path, SIGNED_URL_EXPIRES_IN_SECONDS);

    if (signedUrlError) {
      throw signedUrlError;
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update({ original_photo_path: uploadedPhoto.path })
      .eq('id', ticketId)
      .eq('ticket_book_id', ticket.ticket_book_id);

    if (updateError) {
      throw updateError;
    }

    isCommitted = true;

    if (ticket.original_photo_path) {
      const { error: removeError } = await supabase.storage
        .from(ORIGINAL_TICKET_BUCKET)
        .remove([ticket.original_photo_path]);

      if (removeError) {
        console.error(
          '이전 원본 티켓 사진을 정리하지 못했습니다.',
          removeError,
        );
      }
    }

    return signedPhoto.signedUrl;
  } catch (error) {
    if (!isCommitted) {
      const { error: removeError } = await supabase.storage
        .from(ORIGINAL_TICKET_BUCKET)
        .remove([uploadedPhoto.path]);

      if (removeError) {
        console.error(
          '업로드한 원본 티켓 사진을 정리하지 못했습니다.',
          removeError,
        );
      }
    }

    throw error;
  }
}

export async function deleteTicketOriginalPhoto(ticketId: string) {
  const ticket = await getTicketOriginalPhoto(ticketId);

  if (!ticket.original_photo_path) {
    return;
  }

  const { error: updateError } = await supabase
    .from('tickets')
    .update({ original_photo_path: null })
    .eq('id', ticketId)
    .eq('ticket_book_id', ticket.ticket_book_id);

  if (updateError) {
    throw updateError;
  }

  const { error: removeError } = await supabase.storage
    .from(ORIGINAL_TICKET_BUCKET)
    .remove([ticket.original_photo_path]);

  if (removeError) {
    console.error('원본 티켓 사진을 정리하지 못했습니다.', removeError);
  }
}

export async function deleteTicket(ticketId: string) {
  const { data: deletedTicket, error: deleteError } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)
    .select('original_photo_path, diary_data')
    .single();

  if (deleteError) {
    throw deleteError;
  }

  if (deletedTicket.original_photo_path) {
    const { error: removeError } = await supabase.storage
      .from(ORIGINAL_TICKET_BUCKET)
      .remove([deletedTicket.original_photo_path]);

    if (removeError) {
      console.error('원본 티켓 사진을 정리하지 못했습니다.', removeError);
    }
  }

  const diaryFilePaths = getTicketDiaryFilePaths(
    deletedTicket.diary_data,
    ticketId,
  );

  try {
    await removeTicketDiaryFiles(diaryFilePaths);
  } catch (error) {
    console.error('티켓 다이어리 파일을 정리하지 못했습니다.', error);
  }
}
