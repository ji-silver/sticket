import { getTodayInKorea } from './date.ts';

describe('getTodayInKorea', () => {
  it('한국 시간 자정을 기준으로 날짜를 반환한다', () => {
    expect(getTodayInKorea(new Date('2026-08-01T14:59:59Z'))).toBe(
      '2026-08-01',
    );
    expect(getTodayInKorea(new Date('2026-08-01T15:00:00Z'))).toBe(
      '2026-08-02',
    );
  });
});
