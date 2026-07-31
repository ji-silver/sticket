import { supabase } from '../../lib/supabase.ts';

export interface KboGame {
  id: string;
  date: string;
  time: string;
  stadiumName: string;
  awayTeamName: string;
  homeTeamName: string;
  awayScore: number | null;
  homeScore: number | null;
}

export async function getGamesByDate(date: string): Promise<KboGame[]> {
  const { data, error } = await supabase
    .from('games')
    .select(
      `
        game_key,
        game_date,
        start_time,
        stadium_name,
        away_score,
        home_score,
        awayTeam:teams!games_away_team_id_fkey (
          short_name
        ),
        homeTeam:teams!games_home_team_id_fkey (
          short_name
        )
      `,
    )
    .eq('game_date', date)
    .in('status', ['SCHEDULED', 'IN_PROGRESS', 'FINISHED']) // 예정, 진행중, 종료된 경기만 갖고오기
    .order('start_time', {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw error;
  }

  return data.map(game => {
    if (!game.awayTeam || !game.homeTeam) {
      throw new Error('구단 정보를 찾을 수 없습니다.');
    }

    return {
      id: game.game_key,
      date: game.game_date,
      time: game.start_time?.slice(0, 5) ?? '시간 미정', // 18:30:00으로 표기되기 때문에 18:30
      stadiumName: game.stadium_name ?? '경기장 미정',
      awayTeamName: game.awayTeam.short_name,
      homeTeamName: game.homeTeam.short_name,
      awayScore: game.away_score,
      homeScore: game.home_score,
    };
  });
}
