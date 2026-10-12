jest.mock('../../lib/supabase.ts', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

import { supabase } from '../../lib/supabase.ts';
import { deleteTicketBook, updateTicketBook } from './ticketBook.service.ts';

describe('updateTicketBook 포토카드 제거', () => {
  const update = jest.fn();
  const readSingle = jest.fn();
  const updateSingle = jest.fn();
  const remove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    readSingle.mockResolvedValue({
      data: { cover_photo_path: 'user-1/book-1/cover.jpg' },
      error: null,
    });
    updateSingle.mockResolvedValue({
      data: { id: 'book-1', cover_photo_path: null },
      error: null,
    });
    remove.mockResolvedValue({ error: null });
    const readQuery = { eq: jest.fn(), single: readSingle };
    readQuery.eq.mockReturnValue(readQuery);
    const updateQuery = { eq: jest.fn(), select: jest.fn() };
    updateQuery.eq.mockReturnValue(updateQuery);
    updateQuery.select.mockReturnValue({ single: updateSingle });
    update.mockReturnValue(updateQuery);
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue(readQuery),
      update,
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove });
  });

  it('사진 제거를 명시하면 표지 연결을 비우고 저장 후 파일을 정리한다', async () => {
    await updateTicketBook({
      ticketBookId: 'book-1',
      coverColor: '#DF9EAF',
      coverPattern: 'solid',
      coverImageBase64: null,
    });

    expect(update).toHaveBeenCalledWith({
      cover_color: '#DF9EAF',
      cover_pattern: 'solid',
      cover_photo_path: null,
    });
    expect(remove).toHaveBeenCalledWith(['user-1/book-1/cover.jpg']);
    expect(updateSingle.mock.invocationCallOrder[0]).toBeLessThan(
      remove.mock.invocationCallOrder[0],
    );
  });

  it('표지만 바꾸면 기존 사진의 연결과 파일을 유지한다', async () => {
    await updateTicketBook({
      ticketBookId: 'book-1',
      coverColor: '#8DB7E4',
      coverPattern: 'solid',
    });

    expect(update).toHaveBeenCalledWith({
      cover_color: '#8DB7E4',
      cover_pattern: 'solid',
    });
    expect(readSingle).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('사진 제거를 저장하지 못하면 기존 파일은 삭제하지 않는다', async () => {
    const error = new Error('update failed');
    updateSingle.mockResolvedValueOnce({ data: null, error });

    await expect(
      updateTicketBook({
        ticketBookId: 'book-1',
        coverColor: '#DF9EAF',
        coverPattern: 'solid',
        coverImageBase64: null,
      }),
    ).rejects.toBe(error);

    expect(remove).not.toHaveBeenCalled();
  });
});

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
