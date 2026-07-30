import { chromium } from 'playwright';
import type {
  KboGame,
  KboGameStatus,
  KboSeriesType,
  KboTeamId,
} from './types.ts';

const KBO_SCHEDULE_URL = 'https://www.koreabaseball.com/Schedule/Schedule.aspx';

const teamIdByName: Record<string, KboTeamId> = {
  SSG: 'ssg',
  LG: 'lg',
  두산: 'doosan',
  KIA: 'kia',
  삼성: 'samsung',
  롯데: 'lotte',
  한화: 'hanwha',
  키움: 'kiwoom',
  KT: 'kt',
  NC: 'nc',
};

const teamPattern = Object.keys(teamIdByName).join('|');

const matchupPattern = new RegExp(
  `^(${teamPattern})(\\d+)?vs(\\d+)?(${teamPattern})$`,
);

interface RawScheduleRow {
  day: string | null;
  time: string;
  matchup: string;
  relay: string;
  stadium: string;
  note: string;
  gameHref: string | null;
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage({
    locale: 'ko-KR',
  });

  try {
    await page.goto(KBO_SCHEDULE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await page.waitForSelector('#tblScheduleList');

    const selectedYear = Number(await page.locator('#ddlYear').inputValue());

    const selectedMonth = await page.locator('#ddlMonth').inputValue();

    const selectedSeriesValue = await page.locator('#ddlSeries').inputValue();

    const seriesType = parseSeriesType(selectedSeriesValue);

    console.log('선택된 연도:', selectedYear);
    console.log('선택된 월:', selectedMonth);
    console.log('선택된 경기 종류:', seriesType);

    const rawRows: RawScheduleRow[] = await page
      .locator('#tblScheduleList > tbody > tr')
      .evaluateAll(rows =>
        rows.map(row => {
          const cells = Array.from(
            row.querySelectorAll(':scope > th, :scope > td'),
          );

          const dayCell = row.querySelector<HTMLElement>('.day');

          const timeCell = row.querySelector<HTMLElement>('.time');

          const playCell = row.querySelector<HTMLElement>('.play');

          const relayCell = row.querySelector<HTMLElement>('.relay');

          const gameLink =
            row.querySelector<HTMLAnchorElement>('a[href*="gameId="]');

          // 날짜 셀이 있으면 나머지 셀 번호가 하나씩 밀립니다.
          const offset = dayCell ? 1 : 0;

          const stadiumCell = cells[6 + offset] as HTMLElement | undefined;

          const noteCell = cells[7 + offset] as HTMLElement | undefined;

          return {
            day: dayCell?.innerText.trim() ?? null,

            time: timeCell?.innerText.trim() ?? '',

            matchup: playCell?.innerText.replace(/\s+/g, '').trim() ?? '',

            relay: relayCell?.innerText.trim() ?? '',

            stadium: stadiumCell?.innerText.replace(/\s+/g, ' ').trim() ?? '',

            note: noteCell?.innerText.replace(/\s+/g, ' ').trim() ?? '',

            gameHref: gameLink?.getAttribute('href') ?? null,
          };
        }),
      );

    const games = parseScheduleRows(selectedYear, seriesType, rawRows);

    validateGameKeys(games);
    printCollectionResult(games);
  } finally {
    await browser.close();
  }
}

function parseScheduleRows(
  season: number,
  seriesType: KboSeriesType,
  rows: RawScheduleRow[],
): KboGame[] {
  const games: KboGame[] = [];

  // 같은 날짜의 첫 행에만 날짜가 표시되므로 기억해둡니다.
  let currentGameDate: string | null = null;

  // 같은 날짜에 같은 팀이 여러 번 경기할 수 있으므로
  // 더블헤더 순번을 관리합니다.
  const gameNumberByMatchup = new Map<string, number>();

  const today = getTodayInKorea();

  rows.forEach((row, rowIndex) => {
    if (row.day) {
      currentGameDate = parseGameDate(season, row.day);
    }

    const gameDate = currentGameDate;

    if (!gameDate) {
      console.warn(`${rowIndex}번째 행의 날짜를 확인할 수 없습니다.`);

      return;
    }

    const matchup = parseMatchup(row.matchup);

    if (!matchup) {
      console.warn(
        `${rowIndex}번째 경기 형식을 분석하지 못했습니다:`,
        row.matchup,
      );

      return;
    }

    const gameKeyBase = [gameDate, matchup.awayTeamId, matchup.homeTeamId].join(
      '-',
    );

    const gameNumber = (gameNumberByMatchup.get(gameKeyBase) ?? 0) + 1;

    gameNumberByMatchup.set(gameKeyBase, gameNumber);

    const gameKey = [
      gameDate.replaceAll('-', ''),
      matchup.awayTeamId,
      matchup.homeTeamId,
      gameNumber,
    ].join('-');

    const status = parseGameStatus(
      gameDate,
      today,
      row.time,
      row.relay,
      row.note,
      matchup.awayScore,
      matchup.homeScore,
    );

    games.push({
      gameKey,
      sourceGameId: extractGameId(row.gameHref),
      season,
      seriesType,
      gameDate,
      startTime: row.time,
      awayTeamId: matchup.awayTeamId,
      homeTeamId: matchup.homeTeamId,
      awayScore: matchup.awayScore,
      homeScore: matchup.homeScore,
      stadiumName: row.stadium,
      status,
      cancellationReason:
        status === 'CANCELLED' || status === 'POSTPONED'
          ? normalizeNote(row.note)
          : null,
    });
  });

  return games;
}

function parseGameDate(season: number, dayText: string): string {
  const match = dayText.match(/(\d{2})\.(\d{2})/);

  if (!match) {
    throw new Error(`날짜 형식이 올바르지 않습니다: ${dayText}`);
  }

  const [, month, day] = match;

  return `${season}-${month}-${day}`;
}

function parseMatchup(matchupText: string) {
  const normalizedText = matchupText.replace(/\s+/g, '').trim();

  const match = normalizedText.match(matchupPattern);

  if (!match) {
    return null;
  }

  const [, awayTeamName, awayScoreText, homeScoreText, homeTeamName] = match;

  return {
    awayTeamId: teamIdByName[awayTeamName],
    homeTeamId: teamIdByName[homeTeamName],

    awayScore: awayScoreText === undefined ? null : Number(awayScoreText),

    homeScore: homeScoreText === undefined ? null : Number(homeScoreText),
  };
}

function extractGameId(href: string | null): string | null {
  if (!href) {
    return null;
  }

  const url = new URL(href, KBO_SCHEDULE_URL);

  return url.searchParams.get('gameId');
}

function parseSeriesType(value: string): KboSeriesType {
  switch (value) {
    case '1':
      return 'PRESEASON';

    case '0,9,6':
      return 'REGULAR';

    case '3,4,5,7':
      return 'POSTSEASON';

    default:
      throw new Error(`지원하지 않는 경기 종류입니다: ${value}`);
  }
}

function parseGameStatus(
  gameDate: string,
  today: string,
  time: string,
  relay: string,
  note: string,
  awayScore: number | null,
  homeScore: number | null,
): KboGameStatus {
  const statusText = `${time} ${relay} ${note}`;

  if (statusText.includes('연기')) {
    return 'POSTPONED';
  }

  if (statusText.includes('취소')) {
    return 'CANCELLED';
  }

  if (relay.includes('리뷰')) {
    return 'FINISHED';
  }

  if (awayScore !== null && homeScore !== null) {
    return 'IN_PROGRESS';
  }

  // 이미 날짜가 지났지만 점수와 취소 정보가 없으면
  // 예정 경기로 단정하지 않습니다.
  if (gameDate < today) {
    return 'UNKNOWN';
  }

  return 'SCHEDULED';
}

function normalizeNote(note: string): string | null {
  const normalizedNote = note.trim();

  if (!normalizedNote || normalizedNote === '-') {
    return null;
  }

  return normalizedNote;
}

function getTodayInKorea(): string {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = dateParts.find(part => part.type === 'year')?.value;

  const month = dateParts.find(part => part.type === 'month')?.value;

  const day = dateParts.find(part => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('한국 기준 오늘 날짜를 생성하지 못했습니다.');
  }

  return `${year}-${month}-${day}`;
}

function validateGameKeys(games: KboGame[]) {
  const gameKeys = games.map(game => game.gameKey);
  const uniqueGameKeys = new Set(gameKeys);

  if (uniqueGameKeys.size !== gameKeys.length) {
    throw new Error('중복된 gameKey가 발견되었습니다.');
  }
}

function printCollectionResult(games: KboGame[]) {
  const gamesWithoutSourceId = games.filter(game => game.sourceGameId === null);

  const statusCounts = games.reduce<Record<string, number>>((counts, game) => {
    counts[game.status] = (counts[game.status] ?? 0) + 1;

    return counts;
  }, {});

  console.log('\n수집 결과');
  console.log(`수집한 경기 수: ${games.length}`);
  console.log(`KBO 고유 ID가 없는 경기 수: ${gamesWithoutSourceId.length}`);

  console.log('\n경기 상태별 개수');
  console.log(statusCounts);

  console.log('\n앞의 경기 5개');
  console.log(JSON.stringify(games.slice(0, 5), null, 2));

  if (gamesWithoutSourceId.length > 0) {
    console.log('\nKBO 고유 ID가 없는 경기');
    console.log(JSON.stringify(gamesWithoutSourceId, null, 2));
  }

  const unconfirmedGames = games.filter(
    game =>
      game.status === 'UNKNOWN' ||
      game.status === 'CANCELLED' ||
      game.status === 'POSTPONED',
  );

  if (unconfirmedGames.length > 0) {
    console.log('\n확인이 필요한 경기');
    console.log(JSON.stringify(unconfirmedGames, null, 2));
  }
}

main().catch(error => {
  console.error('KBO 경기 수집 실패:', error);
  process.exitCode = 1;
});
