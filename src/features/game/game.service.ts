import { supabase } from '../../lib/supabase';
import { getTodayInKorea } from '../../lib/date.ts';
import { KboGame, TeamCalendarGame } from './types';

export async function getGamesByDate(date: string): Promise<KboGame[]> {
  if (date > getTodayInKorea()) {
    return [];
  }

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

export async function getLeagueGameDatesByMonth(
  year: number,
  month: number,
): Promise<string[]> {
  const monthText = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = `${year}-${monthText}-01`;
  const endDate = `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('games')
    .select('game_date')
    .gte('game_date', startDate)
    .lte('game_date', endDate);

  if (error) {
    throw error;
  }

  return Array.from(new Set(data.map(game => game.game_date)));
}

// 해당 월의 시작일과 마지막일을 계산하여, 해당 월의 경기 정보를 가져오는 함수
export async function getTeamGamesByMonth(
  teamId: string,
  year: number,
  month: number,
): Promise<TeamCalendarGame[]> {
  const monthText = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();

  const startDate = `${year}-${monthText}-01`;
  const endDate = `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('games')
    .select(
      `
        game_key,
        game_date,
        start_time,
        stadium_name,
        status,
        away_team_id,
        home_team_id,
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
    .gte('game_date', startDate)
    .lte('game_date', endDate)
    // gte이상 lte이하
    .or(`away_team_id.eq.${teamId},home_team_id.eq.${teamId}`)
    .order('game_date', {
      ascending: true,
    })
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

    const isHome = game.home_team_id === teamId;

    return {
      id: game.game_key,
      date: game.game_date,
      time: game.start_time?.slice(0, 5) ?? '시간 미정',
      stadiumName: game.stadium_name ?? '경기장 미정',
      homeAway: isHome ? 'H' : 'A',
      opponentName: isHome
        ? game.awayTeam.short_name
        : game.homeTeam.short_name,
      status: game.status,
      awayScore: game.away_score,
      homeScore: game.home_score,
    };
  });
}
