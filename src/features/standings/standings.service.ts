import { supabase } from '../../lib/supabase';
import { parseStandings, validateStandingsDate } from './standings';
import type { KboStandingsSnapshot } from './types';

export async function getKboStandings(
  season: number,
): Promise<KboStandingsSnapshot | null> {
  const { data, error } = await supabase
    .from('kbo_standings')
    .select('season, as_of_date, standings')
    .eq('season', season)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  if (data.season !== season)
    throw new Error('요청한 시즌의 KBO 순위가 아닙니다.');
  validateStandingsDate(data.as_of_date, season);
  return {
    season,
    asOfDate: data.as_of_date,
    standings: parseStandings(data.standings),
  };
}
