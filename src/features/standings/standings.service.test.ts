jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../lib/supabase';
import { getKboStandings } from './standings.service';
import { parseStandings, validateStandingsDate } from './standings';

const standings = [
  ['kt', 1, 142, 88, 49, 5, 0.642, 0],
  ['samsung', 2, 141, 83, 55, 3, 0.601, 5.5],
  ['kia', 3, 140, 76, 62, 2, 0.551, 12.5],
  ['lg', 4, 141, 77, 63, 1, 0.55, 12.5],
  ['doosan', 5, 143, 73, 65, 5, 0.529, 15.5],
  ['ssg', 6, 142, 64, 73, 5, 0.467, 24],
  ['nc', 7, 142, 63, 77, 2, 0.45, 26.5],
  ['lotte', 8, 140, 61, 76, 3, 0.445, 27],
  ['hanwha', 9, 143, 57, 82, 4, 0.41, 32],
  ['kiwoom', 10, 144, 50, 90, 4, 0.357, 39.5],
].map(([teamId, rank, played, wins, losses, draws, winRate, gamesBehind]) => ({
  teamId,
  rank,
  played,
  wins,
  losses,
  draws,
  winRate,
  gamesBehind,
}));

describe('KBO 순위 검증', () => {
  it('10개 구단을 공식 순위대로 반환하고 기존 구단 이름을 연결한다', () => {
    const result = parseStandings([...standings].reverse());
    expect(result).toHaveLength(10);
    expect(result[0]).toEqual({
      teamId: 'kt',
      teamName: 'KT',
      rank: 1,
      played: 142,
      wins: 88,
      losses: 49,
      draws: 5,
      winRate: 0.642,
      gamesBehind: 0,
    });
    expect(result[9].teamName).toBe('키움');
  });

  it('동률 순위를 다시 매기지 않는다', () => {
    const result = parseStandings(
      standings.map(row => (row.teamId === 'lg' ? { ...row, rank: 3 } : row)),
    );
    expect(result.filter(row => row.rank === 3).map(row => row.teamId)).toEqual(
      ['kia', 'lg'],
    );
  });

  it.each([
    ['누락 구단', standings.slice(0, 9)],
    ['중복 구단', [...standings.slice(0, 9), standings[0]]],
    [
      '알 수 없는 구단',
      [{ ...standings[0], teamId: 'unknown' }, ...standings.slice(1)],
    ],
    ['잘못된 승률', [{ ...standings[0], winRate: 1.5 }, ...standings.slice(1)]],
    ['음수 승수', [{ ...standings[0], wins: -1 }, ...standings.slice(1)]],
    ['경기수 불일치', [{ ...standings[0], played: 1 }, ...standings.slice(1)]],
    ['잘못된 순위', [{ ...standings[0], rank: 0 }, ...standings.slice(1)]],
    [
      '유한하지 않은 게임차',
      [{ ...standings[0], gamesBehind: Infinity }, ...standings.slice(1)],
    ],
    ['비어 있는 데이터', null],
  ])('%s 데이터는 순위표로 표시하지 않는다', (_name, value) => {
    expect(() => parseStandings(value)).toThrow();
  });

  it('승률 순위와 게임차가 반대여도 공식 음수 게임차를 유지한다', () => {
    const result = parseStandings([
      {
        ...standings[0],
        played: 73,
        wins: 44,
        losses: 29,
        draws: 0,
        winRate: 0.603,
      },
      {
        ...standings[1],
        played: 80,
        wins: 48,
        losses: 32,
        draws: 0,
        winRate: 0.6,
        gamesBehind: -0.5,
      },
      ...standings.slice(2),
    ]);
    expect(result[1].rank).toBe(2);
    expect(result[1].gamesBehind).toBe(-0.5);
  });

  it('승패가 없는 구단의 승률은 집계 전으로 유지한다', () => {
    const result = parseStandings(
      standings.map(row =>
        row.teamId === 'kt'
          ? { ...row, wins: 0, losses: 0, draws: 1, played: 1, winRate: null }
          : row,
      ),
    );
    expect(result[0].winRate).toBeNull();
  });

  it.each(['2025-10-07', '2026-02-30', '2026-13-01', 'wrong'])(
    '잘못된 기준일 %s를 거부한다',
    date => {
      expect(() => validateStandingsDate(date, 2026)).toThrow();
    },
  );
});

describe('KBO 순위 조회', () => {
  const maybeSingle = jest.fn();
  const eq = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    eq.mockReturnValue({ maybeSingle });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({ eq }),
    });
  });

  it('요청한 시즌의 저장된 기준일과 전체 순위를 반환한다', async () => {
    maybeSingle.mockResolvedValue({
      data: { season: 2026, as_of_date: '2026-10-07', standings },
      error: null,
    });
    const result = await getKboStandings(2026);
    expect(eq).toHaveBeenCalledWith('season', 2026);
    expect(result?.asOfDate).toBe('2026-10-07');
    expect(result?.standings).toHaveLength(10);
  });

  it('저장된 순위가 없으면 집계 전 상태를 반환한다', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getKboStandings(2026)).toBeNull();
  });

  it('서버 오류를 빈 순위로 바꾸지 않는다', async () => {
    const error = new Error('network error');
    maybeSingle.mockResolvedValue({ data: null, error });
    await expect(getKboStandings(2026)).rejects.toBe(error);
  });

  it('다른 시즌의 스냅샷은 현재 순위로 반환하지 않는다', async () => {
    maybeSingle.mockResolvedValue({
      data: { season: 2025, as_of_date: '2025-10-07', standings },
      error: null,
    });
    await expect(getKboStandings(2026)).rejects.toThrow();
  });
});
