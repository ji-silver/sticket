jest.mock('../../lib/supabase.ts', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

import { supabase } from '../../lib/supabase.ts';
import { updateTicketOriginalPhoto } from './ticket.service.ts';

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
