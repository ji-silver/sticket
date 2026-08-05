jest.mock('../../lib/supabase.ts', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '../../lib/supabase.ts';
import { getAttendanceSummary } from './profile.service.ts';

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
