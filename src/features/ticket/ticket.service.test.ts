jest.mock('../../lib/supabase.ts', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

import { supabase } from '../../lib/supabase.ts';
import {
  deleteTicket,
  getTickets,
  setTicketPageOrientation,
  updateTicketOriginalPhoto,
} from './ticket.service.ts';

describe('getTickets', () => {
  it('취소된 경기 상태를 티켓에 전달한다', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'ticket-1',
          seat_name: null,
          rating: null,
          memo: null,
          foods: [],
          original_photo_path: null,
          page_orientation: 'landscape',
          created_at: '2026-08-05T00:00:00Z',
          game: {
            game_date: '2026-08-05',
            start_time: '18:30:00',
            stadium_name: '고척 스카이돔',
            status: 'CANCELLED',
            away_lineup: [
              {
                battingOrder: 1,
                position: 'CF',
                playerName: '홍창기',
              },
            ],
            home_lineup: [],
            away_score: null,
            home_score: null,
            awayTeam: { short_name: 'LG' },
            homeTeam: { short_name: '키움' },
          },
        },
      ],
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({ order }),
    });

    const tickets = await getTickets();

    expect(tickets[0].isCancelled).toBe(true);
    expect(tickets[0].gameStatus).toBe('CANCELLED');
    expect(tickets[0].pageOrientation).toBe('landscape');
    expect(tickets[0].awayLineup).toEqual([
      {
        battingOrder: 1,
        position: 'CF',
        playerName: '홍창기',
      },
    ]);
  });
});

describe('setTicketPageOrientation', () => {
  it('아직 방향이 없는 티켓에 최초 방향만 저장한다', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { page_orientation: 'landscape' },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ maybeSingle });
    const is = jest.fn().mockReturnValue({ select });
    const eq = jest.fn().mockReturnValue({ is });
    const update = jest.fn().mockReturnValue({ eq });

    (supabase.from as jest.Mock).mockReturnValue({ update });

    await expect(
      setTicketPageOrientation('ticket-1', 'landscape'),
    ).resolves.toBe('landscape');
    expect(is).toHaveBeenCalledWith('page_orientation', null);
  });
});

describe('updateTicketOriginalPhoto', () => {
  it('DB 갱신이 실패하면 새 사진만 정리하고 기존 사진은 유지한다', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1234);

    const updateError = new Error('update failed');
    const select = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            ticket_book_id: 'book-1',
            original_photo_path: 'user-1/book-1/ticket-1/original.jpg',
          },
          error: null,
        }),
      }),
    });
    const update = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: updateError }),
      }),
    });
    const upload = jest.fn().mockResolvedValue({
      data: {
        path: 'user-1/book-1/ticket-1/original-1234.jpg',
      },
      error: null,
    });
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://example.com/ticket.jpg' },
      error: null,
    });
    const remove = jest.fn().mockResolvedValue({ error: null });

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select })
      .mockReturnValueOnce({ update });
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload,
      createSignedUrl,
      remove,
    });

    await expect(
      updateTicketOriginalPhoto('ticket-1', 'dGVzdA=='),
    ).rejects.toBe(updateError);

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith([
      'user-1/book-1/ticket-1/original-1234.jpg',
    ]);
  });
});

describe('deleteTicket', () => {
  it('티켓 삭제 후 원본 사진과 다이어리 파일을 정리한다', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        original_photo_path: 'user-1/book-1/ticket-1/original.jpg',
        diary_data: {
          version: 1,
          paperType: 'plain',
          items: [
            {
              type: 'photo',
              data: {
                storagePath: 'user-1/ticket-1/photos/photo-1.jpg',
              },
            },
          ],
          drawingPath: 'user-1/ticket-1/drawing/drawing.data',
        },
      },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const eq = jest.fn().mockReturnValue({ select });
    const removeOriginal = jest.fn().mockResolvedValue({ error: null });
    const removeDiary = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockReturnValue({
      delete: jest.fn().mockReturnValue({ eq }),
    });
    (supabase.storage.from as jest.Mock).mockImplementation(bucket => ({
      remove: bucket === 'ticket-originals' ? removeOriginal : removeDiary,
    }));

    await deleteTicket('ticket-1');

    expect(removeOriginal).toHaveBeenCalledWith([
      'user-1/book-1/ticket-1/original.jpg',
    ]);
    expect(removeDiary).toHaveBeenCalledWith([
      'user-1/ticket-1/photos/photo-1.jpg',
      'user-1/ticket-1/drawing/drawing.data',
    ]);
  });

  it('다른 티켓의 다이어리 경로는 삭제하지 않는다', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        original_photo_path: null,
        diary_data: {
          version: 1,
          paperType: 'plain',
          items: [],
          drawingPath: 'user-1/ticket-2/drawing/drawing.data',
        },
      },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const eq = jest.fn().mockReturnValue({ select });
    const removeDiary = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockReturnValue({
      delete: jest.fn().mockReturnValue({ eq }),
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({
      remove: removeDiary,
    });

    await deleteTicket('ticket-1');

    expect(removeDiary).not.toHaveBeenCalled();
  });
});
