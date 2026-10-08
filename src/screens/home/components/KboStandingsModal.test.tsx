import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '../../../test-utils';
import { supabase } from '../../../lib/supabase';
import { parseStandings } from '../../../features/standings/standings';
import KboStandingsModal from './KboStandingsModal';

jest.mock('../../../lib/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../../../lib/date.ts', () => ({
  getTodayInKorea: () => '2026-10-08',
}));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

const standings = [
  ['kt', 1, 142, 88, 49, 5, 0.642, 0],
  ['samsung', 2, 141, 83, 55, 3, 0.601, 5.5],
  ['kia', 3, 140, 76, 62, 2, 0.551, 12.5],
  ['lg', 3, 141, 77, 63, 1, 0.55, 12.5],
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
const snapshot = { season: 2026, as_of_date: '2026-10-07', standings };

describe('KBO 순위 모달', () => {
  const maybeSingle = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest
        .fn()
        .mockReturnValue({ eq: jest.fn().mockReturnValue({ maybeSingle }) }),
    });
    maybeSingle.mockResolvedValue({ data: snapshot, error: null });
  });

  it('열려 있지 않으면 순위를 요청하지 않는다', async () => {
    await render(
      <KboStandingsModal
        visible={false}
        favoriteTeamId="ssg"
        onClose={onClose}
      />,
    );
    expect(supabase.from).not.toHaveBeenCalled();
    expect(screen.queryByText('KBO 순위')).toBeNull();
  });

  it('기준일 없이 전체 구단을 표시하고 가입 때 선택한 응원 구단을 알려준다', async () => {
    await render(
      <KboStandingsModal visible favoriteTeamId="ssg" onClose={onClose} />,
    );
    expect(await screen.findByText('SSG')).toBeVisible();
    expect(screen.queryByText('2026.10.07 기준')).toBeNull();
    expect(screen.getByText('2026 정규시즌')).toBeVisible();
    expect(
      screen.getByLabelText(
        'SSG, 응원 구단, 6위, 64승 73패 5무, 승률 0.467, 게임차 24',
      ),
    ).toBeVisible();
    expect(
      screen.getByLabelText(
        '키움, 10위, 50승 90패 4무, 승률 0.357, 게임차 39.5',
      ),
    ).toBeVisible();
    expect(screen.getByLabelText(/KIA, 3위/)).toBeVisible();
    expect(screen.getByLabelText(/LG, 3위/)).toBeVisible();
  });

  it('닫기 버튼으로 캘린더로 돌아간다', async () => {
    const user = userEvent.setup();
    await render(
      <KboStandingsModal visible favoriteTeamId="ssg" onClose={onClose} />,
    );
    await user.press(screen.getByRole('button', { name: 'KBO 순위 닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('저장된 데이터가 없으면 순위를 만들지 않고 집계 전을 안내한다', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await render(
      <KboStandingsModal visible favoriteTeamId="ssg" onClose={onClose} />,
    );
    expect(
      await screen.findByText('아직 순위가 집계되지 않았어요'),
    ).toBeVisible();
  });

  it('조회에 실패한 뒤 다시 시도하면 실제 순위표를 표시한다', async () => {
    const user = userEvent.setup();
    maybeSingle.mockResolvedValueOnce({
      data: null,
      error: new Error('network error'),
    });
    await render(
      <KboStandingsModal visible favoriteTeamId="ssg" onClose={onClose} />,
    );
    expect(await screen.findByText('순위를 불러오지 못했어요')).toBeVisible();
    await user.press(
      screen.getByRole('button', { name: 'KBO 순위 다시 시도' }),
    );
    expect(await screen.findByText('SSG')).toBeVisible();
  });

  it('갱신에 실패하면 이전 순위를 유지한다', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    client.setQueryData(
      ['kbo-standings', 2026],
      {
        season: 2026,
        asOfDate: '2026-10-06',
        standings: parseStandings(standings),
      },
      { updatedAt: Date.now() - 6 * 60 * 1000 },
    );
    maybeSingle.mockResolvedValue({
      data: null,
      error: new Error('network error'),
    });
    await render(
      <QueryClientProvider client={client}>
        <KboStandingsModal visible favoriteTeamId="ssg" onClose={onClose} />
      </QueryClientProvider>,
    );
    expect(
      await screen.findByText(
        '최신 순위를 불러오지 못했어요. 이전 순위를 표시하고 있어요.',
      ),
    ).toBeVisible();
    expect(screen.getByLabelText(/SSG, 응원 구단, 6위/)).toBeVisible();
    client.clear();
  });

  it('승패 기록이 없는 구단의 승률을 0 대신 집계 전으로 표시한다', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        ...snapshot,
        standings: standings.map(row =>
          row.teamId === 'kt'
            ? { ...row, played: 1, wins: 0, losses: 0, draws: 1, winRate: 0 }
            : row,
        ),
      },
      error: null,
    });
    await render(
      <KboStandingsModal visible favoriteTeamId="ssg" onClose={onClose} />,
    );
    expect(
      await screen.findByLabelText(/KT, 1위, 0승 0패 1무, 승률 집계 전/),
    ).toBeVisible();
  });

  it('순위표 안에 외부 출처 링크를 표시하지 않는다', async () => {
    await render(
      <KboStandingsModal visible favoriteTeamId="ssg" onClose={onClose} />,
    );
    expect(await screen.findByText('SSG')).toBeVisible();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('새로고침하면 저장된 최신 경기 성적으로 갱신한다', async () => {
    const user = userEvent.setup();
    await render(
      <KboStandingsModal visible favoriteTeamId="ssg" onClose={onClose} />,
    );
    expect(await screen.findByLabelText(/KT, 1위, 88승 49패 5무/)).toBeVisible();
    maybeSingle.mockResolvedValue({
      data: {
        ...snapshot,
        as_of_date: '2026-10-08',
        standings: standings.map(row =>
          row.teamId === 'kt'
            ? { ...row, played: 143, wins: 89, winRate: 0.645 }
            : row,
        ),
      },
      error: null,
    });
    await user.press(screen.getByRole('button', { name: 'KBO 순위 새로고침' }));
    await waitFor(() =>
      expect(screen.getByLabelText(/KT, 1위, 89승 49패 5무/)).toBeVisible(),
    );
  });
});
