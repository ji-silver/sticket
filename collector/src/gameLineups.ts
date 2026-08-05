import type { KboGame, KboLineupPlayer } from './types.ts';

const KBO_GAME_LIST_URL =
  'https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList';
const KBO_BOX_SCORE_URL =
  'https://www.koreabaseball.com/ws/Schedule.asmx/GetBoxScoreScroll';

const kboHeaders = {
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'x-requested-with': 'XMLHttpRequest',
  referer: 'https://www.koreabaseball.com/Schedule/GameCenter/Main.aspx',
  'user-agent': 'Mozilla/5.0',
};

const positionByKboLabel: Record<string, string> = {
  투: 'P',
  포: 'C',
  一: '1B',
  '1': '1B',
  二: '2B',
  '2': '2B',
  三: '3B',
  '3': '3B',
  유: 'SS',
  좌: 'LF',
  중: 'CF',
  우: 'RF',
  지: 'DH',
};

interface GameLineups {
  away: KboLineupPlayer[];
  home: KboLineupPlayer[];
}

type LineupGame = Pick<
  KboGame,
  'gameKey' | 'sourceGameId' | 'season' | 'gameDate' | 'status'
>;

export async function syncGameLineups(games: LineupGame[]): Promise<number> {
  const targets = games.filter(
    game =>
      game.sourceGameId !== null &&
      (game.status === 'SCHEDULED' ||
        game.status === 'IN_PROGRESS' ||
        game.status === 'FINISHED'),
  );

  if (targets.length === 0) {
    return 0;
  }

  const { supabaseAdmin } = await import('./supabaseAdmin.ts');
  const gamesByDate = new Map<string, LineupGame[]>();

  targets.forEach(game => {
    const dateGames = gamesByDate.get(game.gameDate) ?? [];

    dateGames.push(game);
    gamesByDate.set(game.gameDate, dateGames);
  });

  let savedCount = 0;

  for (const [gameDate, dateGames] of gamesByDate) {
    try {
      const seriesIdByGameId = await fetchSeriesIds(gameDate);

      for (const game of dateGames) {
        const sourceGameId = game.sourceGameId;

        if (!sourceGameId) continue;

        const seriesId = seriesIdByGameId.get(sourceGameId);

        if (seriesId === undefined) continue;

        const response = await postKbo(KBO_BOX_SCORE_URL, {
          leId: '1',
          srId: String(seriesId),
          seasonId: String(game.season),
          gameId: sourceGameId,
        });
        const lineups = parseKboLineupsResponse(response);

        if (!lineups) continue;

        const { error } = await supabaseAdmin
          .from('games')
          .update({
            away_lineup: lineups.away,
            home_lineup: lineups.home,
            lineup_collected_at: new Date().toISOString(),
          })
          .eq('game_key', game.gameKey);

        if (error) {
          throw new Error(`라인업 저장에 실패했습니다: ${error.message}`);
        }

        savedCount += 1;
      }
    } catch (error) {
      console.warn(`${gameDate} 라인업을 수집하지 못했습니다.`, error);
    }
  }

  return savedCount;
}

export async function syncMissingGameLineups(): Promise<number> {
  const { supabaseAdmin } = await import('./supabaseAdmin.ts');
  const { data: games, error: gameError } = await supabaseAdmin
    .from('games')
    .select('game_key, source_game_id, season, game_date, status')
    .in('status', ['IN_PROGRESS', 'FINISHED'])
    .is('lineup_collected_at', null)
    .order('game_date', { ascending: false })
    .limit(50);

  if (gameError) {
    throw new Error(`라인업 경기 조회에 실패했습니다: ${gameError.message}`);
  }

  const targets: LineupGame[] = (games ?? []).map(game => ({
    gameKey: game.game_key,
    sourceGameId: game.source_game_id,
    season: game.season,
    gameDate: game.game_date,
    status: game.status as KboGame['status'],
  }));

  return syncGameLineups(targets);
}

async function fetchSeriesIds(gameDate: string) {
  const response = await postKbo(KBO_GAME_LIST_URL, {
    leId: '1',
    srId: '0,1,3,4,5,6,7,8,9',
    date: gameDate.replaceAll('-', ''),
  });
  const seriesIdByGameId = new Map<string, number>();

  if (!isRecord(response) || !Array.isArray(response.game)) {
    return seriesIdByGameId;
  }

  response.game.forEach(game => {
    if (
      isRecord(game) &&
      typeof game.G_ID === 'string' &&
      typeof game.SR_ID === 'number'
    ) {
      seriesIdByGameId.set(game.G_ID, game.SR_ID);
    }
  });

  return seriesIdByGameId;
}

async function postKbo(url: string, values: Record<string, string>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: kboHeaders,
    body: new URLSearchParams(values),
  });

  if (!response.ok) {
    throw new Error(`KBO 응답 실패: ${response.status}`);
  }

  return JSON.parse(await response.text()) as unknown;
}

export function parseKboLineupsResponse(value: unknown): GameLineups | null {
  if (!isRecord(value) || !Array.isArray(value.arrHitter)) {
    return null;
  }

  const away = parseTeamLineup(value.arrHitter[0]);
  const home = parseTeamLineup(value.arrHitter[1]);

  if (away.length !== 9 || home.length !== 9) {
    return null;
  }

  return { away, home };
}

function parseTeamLineup(value: unknown): KboLineupPlayer[] {
  if (!isRecord(value) || typeof value.table1 !== 'string') {
    return [];
  }

  let table: unknown;

  try {
    table = JSON.parse(value.table1) as unknown;
  } catch {
    return [];
  }

  if (!isRecord(table) || !Array.isArray(table.rows)) {
    return [];
  }

  const playerByBattingOrder = new Map<number, KboLineupPlayer>();

  table.rows.forEach(tableRow => {
    if (!isRecord(tableRow) || !Array.isArray(tableRow.row)) return;

    const battingOrder = Number(readCellText(tableRow.row[0]));
    const rawPosition = readCellText(tableRow.row[1]);
    const playerName = readCellText(tableRow.row[2]);

    if (
      !Number.isInteger(battingOrder) ||
      battingOrder < 1 ||
      battingOrder > 9 ||
      !rawPosition ||
      !playerName ||
      playerByBattingOrder.has(battingOrder)
    ) {
      return;
    }

    playerByBattingOrder.set(battingOrder, {
      battingOrder,
      position:
        positionByKboLabel[rawPosition] ??
        positionByKboLabel[rawPosition[0]] ??
        rawPosition,
      playerName,
    });
  });

  return Array.from(playerByBattingOrder.values()).sort(
    (first, second) => first.battingOrder - second.battingOrder,
  );
}

function readCellText(value: unknown) {
  return isRecord(value) && typeof value.Text === 'string'
    ? value.Text.trim()
    : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
