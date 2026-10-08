import { chromium } from 'playwright';
import { parseKboStandings } from './kboStandings.ts';

const KBO_STANDINGS_URL =
  'https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx';

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ locale: 'ko-KR' });
    await page.goto(KBO_STANDINGS_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    const table = page.locator('table.tData').first();
    await table.locator('tbody tr').first().waitFor();
    const headings = await table.locator('thead th').allTextContents();
    if (
      headings
        .slice(0, 8)
        .map(value => value.trim())
        .join(',') !== '순위,팀명,경기,승,패,무,승률,게임차'
    ) {
      throw new Error('KBO 순위표 열 구성이 변경되었습니다.');
    }
    const dateText = await page.locator('.exp2').innerText();
    const rows = await table
      .locator('tbody tr')
      .evaluateAll(elements =>
        elements.map(row =>
          Array.from(row.querySelectorAll('td')).map(
            cell => cell.textContent?.trim() ?? '',
          ),
        ),
      );
    const season = Number(
      new Intl.DateTimeFormat('en', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
      }).format(new Date()),
    );
    const snapshot = parseKboStandings(dateText, rows, season);
    // 페이지 확인은 DB 환경변수 없이 실행할 수 있고, 실제 저장 경로와 같은 검증을 거친다.
    if (process.argv.includes('--dry-run')) {
      console.log(JSON.stringify(snapshot, null, 2));
      return;
    }
    const { supabaseAdmin } = await import('./supabaseAdmin.ts');
    const { error } = await supabaseAdmin.from('kbo_standings').upsert(
      {
        season: snapshot.season,
        as_of_date: snapshot.asOfDate,
        standings: snapshot.standings,
        collected_at: new Date().toISOString(),
      },
      { onConflict: 'season' },
    );
    if (error) throw new Error(`KBO 순위 저장 실패: ${error.message}`);
    console.log(
      `KBO ${season} 정규시즌 순위 10개 구단 저장 완료 (기준일 ${snapshot.asOfDate})`,
    );
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('KBO 순위 수집 실패:', error);
  process.exitCode = 1;
});
