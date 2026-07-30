import { chromium } from 'playwright';

const KBO_SCHEDULE_URL = 'https://www.koreabaseball.com/Schedule/Schedule.aspx';

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

    const selectedYear = await page.locator('#ddlYear').inputValue();
    const selectedMonth = await page.locator('#ddlMonth').inputValue();
    const selectedSeries = await page.locator('#ddlSeries').inputValue();

    console.log('선택된 연도:', selectedYear);
    console.log('선택된 월:', selectedMonth);
    console.log('선택된 경기 종류:', selectedSeries);

    const rowDetails = await page
      .locator('#tblScheduleList > tbody > tr')
      .evaluateAll(rows =>
        rows.slice(0, 10).map((row, rowIndex) => {
          const cells = Array.from(
            row.querySelectorAll(':scope > th, :scope > td'),
          );

          return {
            rowIndex,
            cells: cells.map((cell, cellIndex) => {
              const element = cell as HTMLElement;

              return {
                cellIndex,
                className: element.className,
                text: element.innerText.replace(/\s+/g, ' ').trim(),
                rowSpan: element.getAttribute('rowspan'),
                links: Array.from(element.querySelectorAll('a')).map(link => ({
                  text: link.textContent?.trim() ?? '',
                  href: link.getAttribute('href'),
                })),
              };
            }),
          };
        }),
      );

    console.dir(rowDetails, {
      depth: null,
    });

    await page.waitForTimeout(5_000);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('KBO 일정표 확인 실패:', error);
  process.exitCode = 1;
});
