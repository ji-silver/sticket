import { decode } from 'base64-arraybuffer';

import { supabase } from '../../lib/supabase.ts';

const ORIGINAL_TICKET_BUCKET = 'ticket-originals';
const MAX_SEAT_NAME_LENGTH = 100;

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
