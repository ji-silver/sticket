jest.mock('../../lib/supabase.ts', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

import { supabase } from '../../lib/supabase.ts';
import { getTicketDiaryData } from './ticketDiary.service.ts';

const savedDiary = {
  version: 1,
  orientation: 'portrait',
  paperType: 'plain',
  items: [],
  drawingIndex: 0,
  drawingPath: null,
};

function mockSavedDiary(diaryData: Record<string, unknown>) {
  const single = jest.fn().mockResolvedValue({
    data: { diary_data: diaryData, page_orientation: null },
    error: null,
  });
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });

  (supabase.from as jest.Mock).mockReturnValue({ select });
}

describe('다이어리 속지 배경색 복원', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('배경색이 없는 기존 다이어리는 흰색 속지로 불러온다', async () => {
    mockSavedDiary(savedDiary);

    await expect(getTicketDiaryData('ticket-1')).resolves.toMatchObject({
      paperColor: 'white',
    });
  });

  it('저장된 배경색을 그대로 불러온다', async () => {
    mockSavedDiary({ ...savedDiary, paperColor: 'mint' });

    await expect(getTicketDiaryData('ticket-1')).resolves.toMatchObject({
      paperColor: 'mint',
    });
  });

  it('지원하지 않는 배경색이 저장되어 있으면 불러오지 않는다', async () => {
    mockSavedDiary({ ...savedDiary, paperColor: 'black' });

    await expect(getTicketDiaryData('ticket-1')).rejects.toThrow(
      '저장된 다이어리 형식을 확인할 수 없습니다.',
    );
  });
});
