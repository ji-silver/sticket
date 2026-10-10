jest.mock('../../lib/supabase.ts', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}));

import { supabase } from '../../lib/supabase.ts';
import { getAttendanceSummary, saveProfile } from './profile.service.ts';

test('선택한 시즌에 응원팀이 출전한 종료 경기만 직관 성적에 포함한다', async () => {
  const select = jest.fn().mockResolvedValue({
    data: [
      {
        game: {
          season: 2026,
          status: 'FINISHED',
          away_team_id: 'ssg',
          home_team_id: 'doosan',
          away_score: 5,
          home_score: 2,
        },
      },
      {
        game: {
          season: 2026,
          status: 'FINISHED',
          away_team_id: 'lg',
          home_team_id: 'sk',
          away_score: 3,
          home_score: 3,
        },
      },
      {
        game: {
          season: 2026,
          status: 'FINISHED',
          away_team_id: 'lg',
          home_team_id: 'doosan',
          away_score: 4,
          home_score: 1,
        },
      },
      {
        game: {
          season: 2026,
          status: 'IN_PROGRESS',
          away_team_id: 'ssg',
          home_team_id: 'kia',
          away_score: 1,
          home_score: 0,
        },
      },
      {
        game: {
          season: 2025,
          status: 'FINISHED',
          away_team_id: 'ssg',
          home_team_id: 'kia',
          away_score: 0,
          home_score: 4,
        },
      },
    ],
    error: null,
  });

  (supabase.from as jest.Mock).mockReturnValue({ select });

  await expect(getAttendanceSummary('ssg', 2026)).resolves.toEqual({
    totalGames: 2,
    wins: 1,
    draws: 1,
    losses: 0,
  });
});

describe('닉네임 저장', () => {
  const single = jest.fn();
  const upsert = jest.fn(() => ({ select: () => ({ single }) }));

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    });
    const teamQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: 'lg' }, error: null }),
    };
    (supabase.from as jest.Mock).mockImplementation(table =>
      table === 'teams' ? teamQuery : { upsert },
    );
  });

  it('DB에서 닉네임 중복을 거절하면 사용자가 이해할 수 있는 오류로 전달한다', async () => {
    single.mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "profiles_nickname_unique"',
      },
    });

    await expect(
      saveProfile({ nickname: '직관팬', favoriteTeamName: 'LG 트윈스' }),
    ).rejects.toThrow('이미 사용 중인 닉네임이에요');
  });

  it('닉네임 외의 중복 오류는 닉네임 오류로 바꾸지 않는다', async () => {
    const error = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "other_unique"',
    };
    single.mockResolvedValue({ data: null, error });
    await expect(
      saveProfile({ nickname: '직관팬', favoriteTeamName: 'LG 트윈스' }),
    ).rejects.toBe(error);
  });

  it('중복이 없는 닉네임은 앞뒤 공백을 제거해 저장한다', async () => {
    const profile = { id: 'user-id', nickname: '직관팬' };
    single.mockResolvedValue({ data: profile, error: null });
    await expect(
      saveProfile({ nickname: ' 직관팬 ', favoriteTeamName: 'LG 트윈스' }),
    ).resolves.toEqual(profile);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-id', nickname: '직관팬' }),
      { onConflict: 'id' },
    );
  });

  it('통신 오류는 중복 오류로 바꾸지 않는다', async () => {
    const error = { code: 'PGRST000', message: 'connection failed' };
    single.mockResolvedValue({ data: null, error });
    await expect(
      saveProfile({ nickname: '직관팬', favoriteTeamName: 'LG 트윈스' }),
    ).rejects.toBe(error);
  });
});
