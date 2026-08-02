export function getRecentGameDates(today: string): [string, string] {
  const [year, month, day] = today.split('-').map(Number);
  const yesterday = new Date(Date.UTC(year, month - 1, day));

  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  return [yesterday.toISOString().slice(0, 10), today];
}

const KBO_SEASON_MONTHS = [
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
];

export function getRemainingSeasonMonths(today: string): string[] {
  const currentMonth = today.slice(5, 7);

  return KBO_SEASON_MONTHS.filter(month => month >= currentMonth);
}

export function getUpcomingScheduleMonths(today: string): string[] {
  return getRemainingSeasonMonths(today).slice(0, 2);
}
