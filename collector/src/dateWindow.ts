export function getRecentGameDates(today: string): [string, string] {
  const [year, month, day] = today.split('-').map(Number);
  const yesterday = new Date(Date.UTC(year, month - 1, day));

  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  return [yesterday.toISOString().slice(0, 10), today];
}
