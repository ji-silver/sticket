import React from 'react';
import { Alert } from 'react-native';
import { render, screen, userEvent, waitFor } from '../../test-utils';
import { useGetLeagueGameDatesByMonth } from '../../features/game/api/useGetLeagueGameDatesByMonth';
import { useGetTeamGamesByMonth } from '../../features/game/api/useGetTeamGamesByMonth';
import { getTicketBooks } from '../../features/ticket-book/ticketBook.service';
import { useCreateTicket } from '../../features/ticket/api/useCreateTicket';
import { useGetTickets } from '../../features/ticket/api/useGetTickets';
import CalendarScreen from './CalendarScreen';

const mockNavigate = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../features/auth/AuthProvider.tsx', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../features/game/api/useGetLeagueGameDatesByMonth', () => ({
  useGetLeagueGameDatesByMonth: jest.fn(),
}));

jest.mock('../../features/game/api/useGetTeamGamesByMonth', () => ({
  useGetTeamGamesByMonth: jest.fn(),
}));

jest.mock('../../features/ticket/api/useGetTickets', () => ({
  useGetTickets: jest.fn(),
}));

jest.mock('../../features/ticket/api/useCreateTicket', () => ({
  useCreateTicket: jest.fn(),
}));

jest.mock('../../features/ticket-book/ticketBook.service.ts', () => ({
  getTicketBooks: jest.fn(),
}));

jest.mock('./components/CalendarMonthView.tsx', () => () => null);

jest.mock('../../lib/date.ts', () => ({
  getTodayInKorea: () => '2026-08-03',
}));

describe('CalendarScreen', () => {
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    mockUseAuth.mockReturnValue({
      profile: {
        favorite_team_id: 'lg',
        favorite_team: { short_name: 'LG' },
        season_ticket_seat_name: '1루 응원지정석 23블록',
        season_ticket_season: 2026,
        season_ticket_team_id: 'lg',
      },
    });
    (useGetTickets as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (useGetLeagueGameDatesByMonth as jest.Mock).mockReturnValue({
      data: ['2026-08-03'],
    });
    (useGetTeamGamesByMonth as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'home-game',
          date: '2026-08-03',
          time: '18:30',
          season: 2026,
          seriesType: 'REGULAR',
          stadiumName: '잠실',
          homeTeamId: 'lg',
          homeAway: 'H',
          opponentName: '두산',
          status: 'FINISHED',
          awayScore: 2,
          homeScore: 3,
        },
      ],
      isLoading: false,
    });
    (getTicketBooks as jest.Mock).mockResolvedValue([{ id: 'ticket-book' }]);
    mockMutateAsync.mockResolvedValue({ id: 'created-ticket' });
    (useCreateTicket as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it('현재 시즌 정규 홈경기는 시즌권 좌석으로 티켓을 만들고 상세 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    await render(<CalendarScreen />);

    await user.press(
      screen.getByRole('button', {
        name: '선택한 경기에 직관 기록 추가',
      }),
    );

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        gameKey: 'home-game',
        seatName: '1루 응원지정석 23블록',
        seatDetail: '',
        originalPhotoBase64: undefined,
      });
      expect(mockNavigate).toHaveBeenCalledWith('TicketDetail', {
        ticketId: 'created-ticket',
      });
    });
  });

  it('시즌권 적용 대상이 아닌 경기는 좌석 없이 티켓을 만든다', async () => {
    const user = userEvent.setup();
    (useGetTeamGamesByMonth as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'away-game',
          date: '2026-08-03',
          time: '18:30',
          season: 2026,
          seriesType: 'REGULAR',
          stadiumName: '잠실',
          homeTeamId: 'doosan',
          homeAway: 'A',
          opponentName: '두산',
          status: 'FINISHED',
          awayScore: 3,
          homeScore: 2,
        },
      ],
      isLoading: false,
    });

    await render(<CalendarScreen />);
    await user.press(
      screen.getByRole('button', {
        name: '선택한 경기에 직관 기록 추가',
      }),
    );

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ seatName: '' }),
      );
    });
  });

  it('우리 팀 경기가 없는 날짜에서는 기존 티켓 추가 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    (useGetTeamGamesByMonth as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    await render(<CalendarScreen />);
    await user.press(
      screen.getByRole('button', { name: '선택한 날짜에 티켓 추가' }),
    );

    await waitFor(() => {
      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('AddTicket', {
        initialDate: '2026-08-03',
      });
    });
  });

  it('티켓 생성에 실패하면 오류를 안내하고 상세 화면으로 이동하지 않는다', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValueOnce(new Error('network error'));

    await render(<CalendarScreen />);
    await user.press(
      screen.getByRole('button', {
        name: '선택한 경기에 직관 기록 추가',
      }),
    );

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '티켓을 추가하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
      expect(mockNavigate).not.toHaveBeenCalledWith(
        'TicketDetail',
        expect.anything(),
      );
    });
  });

  it('티켓북을 확인하는 동안 추가 버튼을 다시 눌러도 한 번만 생성한다', async () => {
    const user = userEvent.setup();
    let resolveTicketBooks!: (value: { id: string }[]) => void;
    (getTicketBooks as jest.Mock).mockReturnValueOnce(
      new Promise(resolve => {
        resolveTicketBooks = resolve;
      }),
    );

    await render(<CalendarScreen />);
    const addButton = screen.getByRole('button', {
      name: '선택한 경기에 직관 기록 추가',
    });

    await user.press(addButton);
    await user.press(addButton);

    expect(getTicketBooks).toHaveBeenCalledTimes(1);

    resolveTicketBooks([{ id: 'ticket-book' }]);
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });
  });
});
