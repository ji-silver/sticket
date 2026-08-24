import { supabase } from '../../lib/supabase';
import { AttendanceSummary } from './types';

interface SaveProfileParams {
  nickname: string;
  favoriteTeamName: string;
  seasonTicketSeat?: {
    name: string;
    season: number;
  } | null;
}

const MAX_SEASON_TICKET_SEAT_NAME_LENGTH = 100;

// 현재 구단과 과거 구단 같은 팀 처리
const FRANCHISE_TEAM_IDS: Record<string, readonly string[]> = {
  ssg: ['ssg', 'sk'],
  kiwoom: ['kiwoom', 'nexen'],
};

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
        id,
        nickname,
        favorite_team_id,
        season_ticket_seat_name,
        season_ticket_season,
        season_ticket_team_id,
        created_at,
        updated_at,
        favorite_team:teams!profiles_favorite_team_id_fkey (
          id,
          name,
          short_name,
          sport
        )
      `,
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getAttendanceSummary(
  favoriteTeamId: string,
  season: number,
): Promise<AttendanceSummary> {
  const favoriteTeamIds = new Set(
    FRANCHISE_TEAM_IDS[favoriteTeamId] ?? [favoriteTeamId],
  );

  const { data, error } = await supabase.from('tickets').select(
    `
        id,
        game:games!tickets_game_key_fkey (
          status,
          season,
          home_team_id,
          away_team_id,
          home_score,
          away_score
        )
      `,
  );

  if (error) {
    throw error;
  }

  return data.reduce<AttendanceSummary>(
    (summary, ticket) => {
      const game = ticket.game;

      if (
        !game ||
        game.season !== season ||
        game.status !== 'FINISHED' ||
        game.home_score === null ||
        game.away_score === null
      ) {
        return summary;
      }

      const isFavoriteTeamHome = favoriteTeamIds.has(game.home_team_id);
      const isFavoriteTeamAway = favoriteTeamIds.has(game.away_team_id);

      if (!isFavoriteTeamHome && !isFavoriteTeamAway) {
        return summary;
      }

      summary.totalGames += 1;

      const favoriteTeamScore = isFavoriteTeamHome
        ? game.home_score
        : game.away_score;

      const opponentScore = isFavoriteTeamHome
        ? game.away_score
        : game.home_score;

      if (favoriteTeamScore > opponentScore) {
        summary.wins += 1;
      } else if (favoriteTeamScore < opponentScore) {
        summary.losses += 1;
      } else {
        summary.draws += 1;
      }

      return summary;
    },
    {
      totalGames: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    },
  );
}

export async function saveProfile({
  nickname,
  favoriteTeamName,
  seasonTicketSeat,
}: SaveProfileParams) {
  const trimmedNickname = nickname.trim();
  const normalizedFavoriteTeamName = favoriteTeamName.trim();
  const normalizedSeasonTicketSeatName = seasonTicketSeat?.name.trim() ?? '';

  if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
    throw new Error('닉네임은 2자 이상 10자 이하로 입력해 주세요.');
  }

  if (!normalizedFavoriteTeamName) {
    throw new Error('응원 구단을 선택해 주세요.');
  }

  if (
    normalizedSeasonTicketSeatName.length > MAX_SEASON_TICKET_SEAT_NAME_LENGTH
  ) {
    throw new Error(
      `시즌권 좌석은 ${MAX_SEASON_TICKET_SEAT_NAME_LENGTH}자 이하로 입력해 주세요.`,
    );
  }

  if (
    seasonTicketSeat &&
    (!normalizedSeasonTicketSeatName ||
      !Number.isInteger(seasonTicketSeat.season))
  ) {
    throw new Error('시즌권 좌석 정보를 확인해 주세요.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('로그인 정보를 확인할 수 없습니다.');
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('sport', 'baseball')
    .eq('name', normalizedFavoriteTeamName)
    .eq('is_active', true)
    .maybeSingle();

  if (teamError) {
    throw teamError;
  }

  if (!team) {
    throw new Error('선택한 응원 구단을 찾을 수 없습니다.');
  }

  const seasonTicketColumns =
    seasonTicketSeat === undefined
      ? {}
      : seasonTicketSeat === null
      ? {
          season_ticket_seat_name: null,
          season_ticket_season: null,
          season_ticket_team_id: null,
        }
      : {
          season_ticket_seat_name: normalizedSeasonTicketSeatName,
          season_ticket_season: seasonTicketSeat.season,
          season_ticket_team_id: team.id,
        };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        nickname: trimmedNickname,
        favorite_team_id: team.id,
        ...seasonTicketColumns,
      },
      {
        onConflict: 'id',
      },
    )
    .select(
      `
        id,
        nickname,
        favorite_team_id,
        season_ticket_seat_name,
        season_ticket_season,
        season_ticket_team_id,
        created_at,
        updated_at,
        favorite_team:teams!profiles_favorite_team_id_fkey (
          id,
          name,
          short_name,
          sport
        )
      `,
    )
    .single();

  if (profileError) {
    throw profileError;
  }

  return profile;
}
