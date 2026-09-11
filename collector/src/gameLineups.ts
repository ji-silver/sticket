import type { KboGame, KboLineupPlayer, KboTeamId } from './types.ts';

const KBO_GAME_LIST_URL =
  'https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList';
const KBO_LINEUP_URL =
  'https://www.koreabaseball.com/ws/Schedule.asmx/GetLineUpAnalysis';

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

const kboTeamNameById: Record<KboTeamId, string> = {
  ssg: 'SSG',
  sk: 'SK',
  lg: 'LG',
  doosan: '두산',
  kia: 'KIA',
  samsung: '삼성',
  lotte: '롯데',
  hanwha: '한화',
  kiwoom: '키움',
  nexen: '넥센',
  kt: 'KT',
  nc: 'NC',
};

interface GameLineups {
  away: KboLineupPlayer[];
  home: KboLineupPlayer[];
}

type LineupGame = Pick<
  KboGame,
  | 'gameKey'
  | 'sourceGameId'
  | 'season'
  | 'gameDate'
  | 'startTime'
  | 'awayTeamId'
  | 'homeTeamId'
  | 'status'
>;

interface KboGameSource {
  gameId: string;
  seriesId: number;
  awayScore: number | null;
  homeScore: number | null;
  isFinished: boolean;
}

const gameListResponseByDate = new Map<string, Promise<unknown>>();

export async function enrichGamesWithKboScores(
  games: KboGame[],
): Promise<KboGame[]> {
  const responses = new Map<string, unknown>();

  await Promise.all(
    Array.from(new Set(games.map(game => game.gameDate))).map(async gameDate => {
      responses.set(gameDate, await fetchKboGameList(gameDate));
    }),
  );

  return games.map(game => {
    const source = resolveKboGameSource(game, responses.get(game.gameDate));
    const needsScore =
      game.status === 'IN_PROGRESS' || game.status === 'FINISHED';

    if (!source) {
      if (needsScore) {
        throw new Error(`${game.gameKey}의 KBO 경기 정보를 찾지 못했습니다.`);
      }

      return game;
    }

    if (source.awayScore === null || source.homeScore === null) {
      if (needsScore) {
        throw new Error(`${game.gameKey}의 KBO 점수를 확인하지 못했습니다.`);
      }

      return { ...game, sourceGameId: source.gameId };
    }

    return {
      ...game,
      sourceGameId: source.gameId,
      awayScore: source.awayScore,
      homeScore: source.homeScore,
      status: source.isFinished ? 'FINISHED' : game.status,
    };
  });
}

export async function syncGameLineups(games: LineupGame[]): Promise<number> {
  const targets = games.filter(
    game =>
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
      const gameListResponse = await fetchKboGameList(gameDate);

      for (const game of dateGames) {
        const source = resolveKboGameSource(game, gameListResponse);

        if (!source) continue;

        const response = await postKbo(KBO_LINEUP_URL, {
          leId: '1',
          srId: String(source.seriesId),
          seasonId: String(game.season),
          gameId: source.gameId,
        });
        const lineups = parseKboLineupsResponse(response);

        if (!lineups) continue;

        const { error } = await supabaseAdmin
          .from('games')
          .update({
            source_game_id: source.gameId,
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
    .select(
      'game_key, source_game_id, season, game_date, start_time, away_team_id, home_team_id, status',
    )
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
    startTime: game.start_time?.slice(0, 5) ?? '',
    awayTeamId: game.away_team_id as KboTeamId,
    homeTeamId: game.home_team_id as KboTeamId,
    status: game.status as KboGame['status'],
  }));

  return syncGameLineups(targets);
}

async function fetchKboGameList(gameDate: string) {
  let response = gameListResponseByDate.get(gameDate);

  if (!response) {
    response = postKbo(KBO_GAME_LIST_URL, {
      leId: '1',
      srId: '0,1,3,4,5,6,7,8,9',
      date: gameDate.replaceAll('-', ''),
    });
    gameListResponseByDate.set(gameDate, response);
  }

  return response;
}

export function resolveKboGameSource(
  game: LineupGame,
  response: unknown,
): KboGameSource | null {
  if (!isRecord(response) || !Array.isArray(response.game)) {
    return null;
  }

  const sources = response.game.filter(
    source =>
      isRecord(source) &&
      typeof source.G_ID === 'string' &&
      typeof source.SR_ID === 'number' &&
      typeof source.G_DT === 'string' &&
      typeof source.G_TM === 'string' &&
      typeof source.AWAY_NM === 'string' &&
      typeof source.HOME_NM === 'string',
  );

  if (game.sourceGameId) {
    const source = sources.find(item => item.G_ID === game.sourceGameId);

    return source ? toKboGameSource(source) : null;
  }

  const candidates = sources.filter(
    source =>
      source.G_DT === game.gameDate.replaceAll('-', '') &&
      source.AWAY_NM.trim() === kboTeamNameById[game.awayTeamId] &&
      source.HOME_NM.trim() === kboTeamNameById[game.homeTeamId],
  );
  const source =
    candidates.length === 1
      ? candidates[0]
      : candidates.find(item => item.G_TM.trim() === game.startTime);

  return source ? toKboGameSource(source) : null;
}

function toKboGameSource(source: Record<string, unknown>): KboGameSource {
  return {
    gameId: source.G_ID as string,
    seriesId: source.SR_ID as number,
    awayScore: parseKboScore(source.T_SCORE_CN),
    homeScore: parseKboScore(source.B_SCORE_CN),
    isFinished: source.GAME_STATE_SC === '3',
  };
}

function parseKboScore(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 ? value : null;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return null;
  }

  return Number(value);
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
  if (!Array.isArray(value)) {
    return null;
  }

  const lineupStatus = Array.isArray(value[0]) ? value[0][0] : null;

  if (!isRecord(lineupStatus) || lineupStatus.LINEUP_CK !== true) {
    return null;
  }

  const away = parseTeamLineup(Array.isArray(value[4]) ? value[4][0] : null);
  const home = parseTeamLineup(Array.isArray(value[3]) ? value[3][0] : null);

  if (away.length !== 9 || home.length !== 9) {
    return null;
  }

  return { away, home };
}

function parseTeamLineup(value: unknown): KboLineupPlayer[] {
  if (typeof value !== 'string') {
    return [];
  }

  let table: unknown;

  try {
    table = JSON.parse(value) as unknown;
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
