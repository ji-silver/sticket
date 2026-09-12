import React from 'react';
import { cleanup, render, screen } from '../../../test-utils.tsx';
import type { Ticket } from '../../../features/ticket/types.ts';
import TicketRecordPage from './TicketRecordPage.tsx';

jest.mock('../../../features/auth/AuthProvider.tsx', () => ({
  useAuth: () => ({ profile: null }),
}));

jest.mock('./TicketVisitInfoSection.tsx', () => () => null);
jest.mock('./TicketReviewSection.tsx', () => () => null);
jest.mock('./TicketLineupSection.tsx', () => () => null);

const ticket: Ticket = {
  id: 'ticket-1',
  createdAt: '2026-09-09T09:00:00Z',
  pageOrientation: 'portrait',
  matchDate: '2026-09-09',
  matchTime: '18:30',
  stadiumName: '잠실',
  seatName: null,
  seatDetail: null,
  rating: null,
  memo: null,
  foods: [],
  homeTeamName: '두산',
  awayTeamName: 'SSG',
  homeScore: 0,
  awayScore: 0,
  gameStatus: 'SCHEDULED',
  gameUpdatedAt: '2026-09-09T09:47:00Z',
  isCancelled: false,
  awayLineup: [],
  homeLineup: [],
};

describe('TicketRecordPage 경기 현황', () => {
  afterEach(cleanup);

  it('경기 날짜와 시간, 장소를 구분점 없이 표시한다', async () => {
    await render(<TicketRecordPage ticket={ticket} orientation="portrait" />);

    expect(screen.getByText('09.09(수) 18:30 잠실')).toBeVisible();
  });

  it('경기 전에는 DB 점수가 0이어도 예정 점수로 표시한다', async () => {
    await render(<TicketRecordPage ticket={ticket} orientation="portrait" />);

    expect(screen.getByLabelText('원정 SSG - 대 홈 두산 -')).toBeVisible();
    expect(screen.queryByText(/기준$/)).not.toBeOnTheScreen();
  });

  it('진행 중에는 최신 점수와 한국 기준 갱신 시각을 표시한다', async () => {
    await render(
      <TicketRecordPage
        ticket={{
          ...ticket,
          gameStatus: 'IN_PROGRESS',
          awayScore: 2,
          homeScore: 3,
        }}
        orientation="portrait"
      />,
    );

    expect(
      screen.getByLabelText('원정 SSG 2 대 홈 두산 3, 경기 진행 중'),
    ).toBeVisible();
    expect(screen.getByText('18:47 기준')).toBeVisible();
  });

  it('종료 후에는 갱신 시각 없이 최종 점수만 표시한다', async () => {
    await render(
      <TicketRecordPage
        ticket={{
          ...ticket,
          gameStatus: 'FINISHED',
          awayScore: 2,
          homeScore: 3,
        }}
        orientation="portrait"
      />,
    );

    expect(screen.getByLabelText('원정 SSG 2 대 홈 두산 3')).toBeVisible();
    expect(screen.queryByText(/기준$/)).not.toBeOnTheScreen();
  });
});
