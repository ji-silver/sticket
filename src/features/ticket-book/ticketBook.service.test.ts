jest.mock('../../lib/supabase.ts', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

import { supabase } from '../../lib/supabase.ts';
import { deleteTicketBook } from './ticketBook.service.ts';

describe('deleteTicketBook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('티켓북 삭제 후 하위 티켓의 모든 파일과 표지를 정리한다', async () => {
    const tickets = [
      {
        id: 'ticket-1',
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
      {
        id: 'ticket-2',
        original_photo_path: null,
        diary_data: {
          version: 1,
          paperType: 'plain',
          items: [
            {
              type: 'photo',
              data: {
                storagePath: 'user-1/ticket-2/photos/photo-2.jpg',
              },
            },
          ],
          drawingPath: null,
        },
      },
    ];
    const ticketSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: tickets, error: null }),
    });
    const single = jest.fn().mockResolvedValue({
      data: { cover_photo_path: 'user-1/book-1/cover.jpg' },
      error: null,
    });
    const bookSelect = jest.fn().mockReturnValue({ single });
    const secondEq = jest.fn().mockReturnValue({ select: bookSelect });
    const firstEq = jest.fn().mockReturnValue({ eq: secondEq });
    const removeOriginal = jest.fn().mockResolvedValue({ error: null });
    const removeDiary = jest.fn().mockResolvedValue({ error: null });
    const removeCover = jest.fn().mockResolvedValue({ error: null });

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: ticketSelect })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({ eq: firstEq }),
      });
    (supabase.storage.from as jest.Mock).mockImplementation(bucket => ({
      remove:
        bucket === 'ticket-originals'
          ? removeOriginal
          : bucket === 'ticket-diaries'
          ? removeDiary
          : removeCover,
    }));

    await deleteTicketBook('book-1');

    expect(ticketSelect).toHaveBeenCalledWith(
      'id, original_photo_path, diary_data',
    );
    expect(removeOriginal).toHaveBeenCalledWith([
      'user-1/book-1/ticket-1/original.jpg',
    ]);
    expect(removeDiary).toHaveBeenCalledWith([
      'user-1/ticket-1/photos/photo-1.jpg',
      'user-1/ticket-1/drawing/drawing.data',
      'user-1/ticket-2/photos/photo-2.jpg',
    ]);
    expect(removeCover).toHaveBeenCalledWith(['user-1/book-1/cover.jpg']);
  });

  it('티켓북 DB 삭제가 실패하면 Storage 파일을 삭제하지 않는다', async () => {
    const deleteError = new Error('delete failed');
    const ticketSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    });
    const single = jest.fn().mockResolvedValue({
      data: null,
      error: deleteError,
    });
    const bookSelect = jest.fn().mockReturnValue({ single });
    const secondEq = jest.fn().mockReturnValue({ select: bookSelect });
    const firstEq = jest.fn().mockReturnValue({ eq: secondEq });

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: ticketSelect })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({ eq: firstEq }),
      });

    await expect(deleteTicketBook('book-1')).rejects.toBe(deleteError);
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });
});
