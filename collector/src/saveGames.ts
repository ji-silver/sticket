import { supabaseAdmin } from './supabaseAdmin.ts';
import type { KboGame } from './types.ts';

export async function upsertGames(games: KboGame[]): Promise<number> {
  if (games.length === 0) {
    return 0;
  }

  const collectedAt = new Date().toISOString();

  const gameRows = games.map(game => ({
    game_key: game.gameKey,
    source_game_id: game.sourceGameId,
    sport: 'baseball',
    season: game.season,
    series_type: game.seriesType,
    game_date: game.gameDate,
    start_time: normalizeStartTime(game.startTime),
    away_team_id: game.awayTeamId,
    home_team_id: game.homeTeamId,
    away_score: game.awayScore,
    home_score: game.homeScore,
    stadium_name: normalizeStadiumName(game.stadiumName),
    status: game.status,
    cancellation_reason: game.cancellationReason,
    last_collected_at: collectedAt,
  }));

  const { data, error } = await supabaseAdmin
    .from('games')
    .upsert(gameRows, {
      onConflict: 'game_key',
    })
    .select('game_key');

  if (error) {
    const errorMessage = [error.message, error.details, error.hint]
      .filter(Boolean)
      .join(' | ');

    throw new Error(`경기 저장에 실패했습니다: ${errorMessage}`);
  }

  return data?.length ?? 0;
}

function normalizeStartTime(startTime: string): string | null {
  const normalizedTime = startTime.trim();

  if (!/^\d{2}:\d{2}$/.test(normalizedTime)) {
    return null;
  }

  return normalizedTime;
}

function normalizeStadiumName(stadiumName: string): string | null {
  const normalizedName = stadiumName.trim();

  if (!normalizedName || normalizedName === '-') {
    return null;
  }

  return normalizedName;
}
