import { chromium, type Page } from 'playwright';
import type {
  KboGame,
  KboGameStatus,
  KboSeriesType,
  KboTeamId,
} from './types.ts';
import { upsertGames } from './saveGames.ts';

const KBO_SCHEDULE_URL = 'https://www.koreabaseball.com/Schedule/Schedule.aspx';

const SERIES_VALUES = ['1', '0,9,6', '3,4,5,7'] as const;
const BACKFILL_START_YEAR = 2015;
const BACKFILL_MONTHS = ['03', '04', '05', '06', '07', '08', '09', '10', '11'];

const teamIdByName: Record<string, KboTeamId> = {
  SSG: 'ssg',
  SK: 'sk',
  LG: 'lg',
  두산: 'doosan',
  KIA: 'kia',
  삼성: 'samsung',
  롯데: 'lotte',
  한화: 'hanwha',
  키움: 'kiwoom',
  넥센: 'nexen',
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

interface CollectionTarget {
  year: number;
  month: string;
}

async function selectScheduleOption(
  page: Page,
  selector: string,
  value: string,
) {
  const select = page.locator(selector);

  if ((await select.inputValue()) === value) {
    return;
  }

  const responsePromise = page.waitForResponse(
    response =>
      response.url().includes('/ws/Schedule.asmx/GetScheduleList') &&
      response.ok(),
  );

  await select.selectOption(value);
  await responsePromise;
}

async function readScheduleRows(page: Page): Promise<RawScheduleRow[]> {
  return page
    .locator('#tblScheduleList > tbody > tr:has(.play)')
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
}

async function main() {
  const targets = getCollectionTargets();
  const isBackfill = process.argv.includes('--backfill');

  const browser = await chromium.launch({
    headless: process.env.CI === 'true',
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

    let totalSavedGameCount = 0;

    for (const [targetIndex, target] of targets.entries()) {
      const targetYear = String(target.year);
      const targetMonth = target.month;

      console.log(
        `\n[${targetIndex + 1}/${targets.length}] ${targetYear}년 ${targetMonth}월 수집`,
      );

      await selectScheduleOption(page, '#ddlYear', targetYear);
      await selectScheduleOption(page, '#ddlMonth', targetMonth);

      const selectedYear = Number(await page.locator('#ddlYear').inputValue());
      const selectedMonth = await page.locator('#ddlMonth').inputValue();

      console.log('선택된 연도:', selectedYear);
      console.log('선택된 월:', selectedMonth);

      let targetSavedGameCount = 0;

      for (const seriesValue of SERIES_VALUES) {
        await selectScheduleOption(page, '#ddlSeries', seriesValue);

        const seriesType = parseSeriesType(seriesValue);
        const rawRows = await readScheduleRows(page);
        const games = parseScheduleRows(selectedYear, seriesType, rawRows);

        console.log('\n선택된 경기 종류:', seriesType);

        validateGameKeys(games);
        printCollectionResult(games, !isBackfill);

        console.log('\nSupabase에 경기를 저장합니다.');

        const savedGameCount = await upsertGames(games);

        targetSavedGameCount += savedGameCount;

        console.log(`Supabase 저장 완료: ${savedGameCount}경기`);
      }

      totalSavedGameCount += targetSavedGameCount;

      console.log(
        `${targetYear}년 ${targetMonth}월 저장 완료: ${targetSavedGameCount}경기`,
      );

      if (isBackfill) {
        await page.waitForTimeout(300);
      }
    }

    console.log(`\n전체 작업 완료: ${totalSavedGameCount}경기`);
  } finally {
    await browser.close();
  }
}

function getCollectionTargets(): CollectionTarget[] {
  const today = getTodayInKorea();
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = today.slice(5, 7);

  if (process.argv.includes('--backfill')) {
    const targets: CollectionTarget[] = [];

    for (let year = BACKFILL_START_YEAR; year <= currentYear; year += 1) {
      for (const month of BACKFILL_MONTHS) {
        if (year === currentYear && month > currentMonth) {
          continue;
        }

        targets.push({ year, month });
      }
    }

    return targets;
  }

  const yearArgument = getArgumentValue('year');
  const monthArgument = getArgumentValue('month');

  if ((yearArgument === null) !== (monthArgument === null)) {
    throw new Error('--year와 --month는 함께 입력해야 합니다.');
  }

  if (yearArgument === null || monthArgument === null) {
    return [{ year: currentYear, month: currentMonth }];
  }

  const year = Number(yearArgument);
  const month = monthArgument.padStart(2, '0');

  if (!Number.isInteger(year) || year < BACKFILL_START_YEAR || year > currentYear) {
    throw new Error(
      `--year는 ${BACKFILL_START_YEAR}년부터 ${currentYear}년 사이여야 합니다.`,
    );
  }

  if (!/^(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error('--month는 1부터 12 사이여야 합니다.');
  }

  if (year === currentYear && month > currentMonth) {
    throw new Error('현재보다 미래인 연·월은 수집할 수 없습니다.');
  }

  return [{ year, month }];
}

function getArgumentValue(name: string): string | null {
  const prefix = `--${name}=`;
  const argument = process.argv.find(value => value.startsWith(prefix));

  return argument?.slice(prefix.length) ?? null;
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

function printCollectionResult(games: KboGame[], printDetails: boolean) {
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

  if (!printDetails) {
    return;
  }

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
