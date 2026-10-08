import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, userEvent, waitFor } from '../../test-utils';
import { useGetTeamGamesByMonth } from '../../features/game/api/useGetTeamGamesByMonth';
import { getTicketBooks } from '../../features/ticket-book/ticketBook.service';
import { useCreateTicket } from '../../features/ticket/api/useCreateTicket';
import { useGetTickets } from '../../features/ticket/api/useGetTickets';
import CalendarScreen from './CalendarScreen';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

const mockNavigate = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 108,
}));

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../features/auth/AuthProvider.tsx', () => ({
  useAuth: () => mockUseAuth(),
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

  it('순위 버튼으로 순위 창을 열고 닫으면 기존 캘린더에 머무른다', async () => {
    const user = userEvent.setup();
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
    await render(<CalendarScreen />);
    expect(supabase.from).not.toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: '순위 보기' }));
    expect(await screen.findByText('아직 순위가 집계되지 않았어요')).toBeVisible();
    await user.press(screen.getByRole('button', { name: 'KBO 순위 닫기' }));
    expect(screen.queryByText('아직 순위가 집계되지 않았어요')).toBeNull();
    expect(screen.getByText('8월 3일 월요일')).toBeVisible();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('현재 시즌 정규 홈경기는 시즌권 좌석으로 티켓을 만들고 상세 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    await render(<CalendarScreen />);

    expect(screen.queryByText(/더블헤더/)).toBeNull();

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

  it('오늘 경기가 없어도 자동 선택을 표시하고 다른 날짜에서 오늘로 다시 돌아올 수 있다', async () => {
    const user = userEvent.setup();
    (useGetTeamGamesByMonth as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    await render(<CalendarScreen />);
    const todayButton = screen.getByRole('button', { name: '8월 3일' });
    expect(todayButton).toBeEnabled();
    expect(todayButton).toBeSelected();

    await user.press(screen.getByRole('button', { name: '8월 4일' }));
    expect(screen.getByText('8월 4일 화요일')).toBeVisible();

    await user.press(screen.getByRole('button', { name: '8월 3일' }));
    expect(screen.getByRole('button', { name: '8월 3일' })).toBeSelected();
    expect(screen.getByText('8월 3일 월요일')).toBeVisible();

    await user.press(
      screen.getByRole('button', { name: '선택한 날짜에 티켓 추가' }),
    );
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('AddTicket', {
        initialDate: '2026-08-03',
      });
    });
  });

  it('경기와 직관 기록이 없는 미래 날짜도 선택하고 경기 없음 안내를 볼 수 있다', async () => {
    const user = userEvent.setup();
    await render(<CalendarScreen />);

    const emptyDay = screen.getByRole('button', { name: '8월 5일' });
    expect(emptyDay).toBeEnabled();
    await user.press(emptyDay);
    expect(screen.getByRole('button', { name: '8월 5일' })).toBeSelected();
    expect(screen.getByText('8월 5일 수요일')).toBeVisible();
    expect(screen.getByText('우리 팀 경기가 없는 날이에요')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: '선택한 날짜에 티켓 추가' }),
    ).toBeNull();
  });

  it('경기가 없는 지난달도 1일을 자동 선택하고 다시 선택한 날짜로 티켓을 추가할 수 있다', async () => {
    const user = userEvent.setup();
    (useGetTeamGamesByMonth as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    await render(<CalendarScreen />);

    await fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(screen.getByRole('button', { name: '7월 1일' })).toBeSelected();
    expect(screen.getByText('7월 1일 수요일')).toBeVisible();
    expect(screen.getByText('우리 팀 경기가 없는 날이에요')).toBeVisible();

    await user.press(screen.getByRole('button', { name: '7월 2일' }));
    expect(screen.getByRole('button', { name: '7월 2일' })).toBeSelected();
    await user.press(screen.getByRole('button', { name: '7월 1일' }));
    expect(screen.getByRole('button', { name: '7월 1일' })).toBeSelected();
    await user.press(
      screen.getByRole('button', { name: '선택한 날짜에 티켓 추가' }),
    );
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('AddTicket', {
        initialDate: '2026-07-01',
      });
    });

    await fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(screen.getByRole('button', { name: /^8월 3일/ })).toBeSelected();
    expect(screen.getByText('8월 3일 월요일')).toBeVisible();
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

  it('더블헤더 1차전을 등록했으면 2차전의 티켓만 추가할 수 있다', async () => {
    const user = userEvent.setup();
    (useGetTickets as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'ticket-1',
          gameKey: 'home-game-1',
          createdAt: '2026-08-03T05:00:00Z',
          pageOrientation: 'portrait',
          matchDate: '2026-08-03',
          matchTime: '14:00',
          stadiumName: '잠실',
          seatName: null,
          seatDetail: null,
          rating: null,
          memo: null,
          foods: [],
          homeTeamName: 'LG',
          awayTeamName: '두산',
          homeScore: 3,
          awayScore: 2,
          gameStatus: 'FINISHED',
          isCancelled: false,
          awayLineup: [],
          homeLineup: [],
        },
      ],
      isLoading: false,
    });
    (useGetTeamGamesByMonth as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'home-game-1',
          date: '2026-08-03',
          time: '14:00',
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
        {
          id: 'home-game-2',
          date: '2026-08-03',
          time: '18:30',
          season: 2026,
          seriesType: 'REGULAR',
          stadiumName: '잠실',
          homeTeamId: 'lg',
          homeAway: 'H',
          opponentName: '두산',
          status: 'FINISHED',
          awayScore: 1,
          homeScore: 4,
        },
      ],
      isLoading: false,
    });

    await render(<CalendarScreen />);

    expect(
      screen.getByRole('button', {
        name: '08월 03일 두산 대 LG, 직관 기록 보기',
      }),
    ).toBeVisible();
    expect(screen.getByText('더블헤더 2차전')).toBeVisible();

    const addButtons = screen.getAllByRole('button', {
      name: '선택한 경기에 직관 기록 추가',
    });
    expect(addButtons).toHaveLength(1);

    await user.press(addButtons[0]);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ gameKey: 'home-game-2' }),
      );
    });
  });
});
