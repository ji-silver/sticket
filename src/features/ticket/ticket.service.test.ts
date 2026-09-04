jest.mock('../../lib/supabase.ts', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

import { supabase } from '../../lib/supabase.ts';
import {
  createTicket,
  deleteTicket,
  getTicketSeasonSummaries,
  getTickets,
  getTicketsBySeason,
  setTicketPageOrientation,
  updateTicketSeat,
  updateTicketOriginalPhoto,
} from './ticket.service.ts';

describe('createTicket', () => {
  it('좌석명과 상세 위치를 다듬어 새 티켓에 저장한다', async () => {
    const gameSingle = jest.fn().mockResolvedValue({
      data: { game_date: '2026-08-30' },
      error: null,
    });
    const gameEq = jest.fn().mockReturnValue({ single: gameSingle });
    const gameSelect = jest.fn().mockReturnValue({ eq: gameEq });

    const bookMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'book-1' },
      error: null,
    });
    const bookEqBySport = jest
      .fn()
      .mockReturnValue({ maybeSingle: bookMaybeSingle });
    const bookEqByUser = jest.fn().mockReturnValue({ eq: bookEqBySport });
    const bookSelect = jest.fn().mockReturnValue({ eq: bookEqByUser });

    const createdTicket = { id: 'ticket-1' };
    const ticketSingle = jest.fn().mockResolvedValue({
      data: createdTicket,
      error: null,
    });
    const ticketSelect = jest.fn().mockReturnValue({ single: ticketSingle });
    const insert = jest.fn().mockReturnValue({ select: ticketSelect });

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: gameSelect })
      .mockReturnValueOnce({ select: bookSelect })
      .mockReturnValueOnce({ insert });

    await expect(
      createTicket({
        gameKey: 'game-1',
        seatName: ' 덕아웃 상단석 ',
        seatDetail: ' 9블록 J열 12번 ',
      }),
    ).resolves.toBe(createdTicket);

    expect(insert).toHaveBeenCalledWith({
      ticket_book_id: 'book-1',
      game_key: 'game-1',
      seat_name: '덕아웃 상단석',
      seat_detail: '9블록 J열 12번',
      original_photo_path: null,
    });
  });
});

describe('getTickets', () => {
  it('취소된 경기 상태를 티켓에 전달한다', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'ticket-1',
          seat_name: null,
          seat_detail: '3블록 J열 12번',
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
    expect(tickets[0].seatDetail).toBe('3블록 J열 12번');
    expect(tickets[0].awayLineup).toEqual([
      {
        battingOrder: 1,
        position: 'CF',
        playerName: '홍창기',
      },
    ]);
  });

  it('선택한 시즌의 티켓만 서버에 요청한다', async () => {
    const order = jest.fn().mockResolvedValue({ data: [], error: null });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });

    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(getTicketsBySeason(2025)).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledWith('game.season', 2025);
    expect(select.mock.calls[0][0]).toContain(
      'game:games!tickets_game_key_fkey!inner',
    );
  });
});

describe('getTicketSeasonSummaries', () => {
  it('사용자 티켓이 1000개를 넘어도 시즌을 빠짐없이 최신순으로 집계한다', async () => {
    const range = jest
      .fn()
      .mockResolvedValueOnce({
        data: Array.from({ length: 1000 }, () => ({
          game: { season: 2025 },
        })),
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ game: { season: 2023 } }],
        error: null,
      });
    const order = jest.fn().mockReturnValue({ range });
    const select = jest.fn().mockReturnValue({ order });

    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(getTicketSeasonSummaries()).resolves.toEqual([
      { season: 2025, ticketCount: 1000 },
      { season: 2023, ticketCount: 1 },
    ]);
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });
});

describe('updateTicketSeat', () => {
  it('좌석명과 상세 위치를 다듬어 함께 저장한다', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        seat_name: '덕아웃 상단석',
        seat_detail: '9블록 J열 12번',
      },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const eq = jest.fn().mockReturnValue({ select });
    const update = jest.fn().mockReturnValue({ eq });

    (supabase.from as jest.Mock).mockReturnValue({ update });

    await expect(
      updateTicketSeat(
        'ticket-1',
        ' 덕아웃 상단석 ',
        ' 9블록 J열 12번 ',
      ),
    ).resolves.toEqual({
      seatName: '덕아웃 상단석',
      seatDetail: '9블록 J열 12번',
    });

    expect(update).toHaveBeenCalledWith({
      seat_name: '덕아웃 상단석',
      seat_detail: '9블록 J열 12번',
    });
    expect(select).toHaveBeenCalledWith('seat_name, seat_detail');
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
