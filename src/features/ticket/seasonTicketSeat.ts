import type { UserProfile } from '../auth/auth.types.ts';
import type { KboGame } from '../game/types.ts';

type SeasonTicketGame = Pick<
  KboGame,
  'homeTeamId' | 'season' | 'seriesType'
>;

export function getSeasonTicketSeatName(
  profile: UserProfile | null,
  game: SeasonTicketGame | undefined,
  currentSeason: number,
) {
  if (
    !game ||
    !profile?.season_ticket_seat_name ||
    profile.season_ticket_season !== currentSeason ||
    profile.season_ticket_team_id !== game.homeTeamId ||
    profile.favorite_team_id !== game.homeTeamId ||
    game.season !== currentSeason ||
    game.seriesType !== 'REGULAR'
  ) {
    return '';
  }

  return profile.season_ticket_seat_name;
}
