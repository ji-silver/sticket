import React from 'react';
import { cleanup, render, screen, userEvent } from '../../test-utils';
import {
  useGetTicket,
  useGetTicketGameSnapshot,
} from '../../features/ticket/api/useGetTickets';
import TicketDetailScreen from './TicketDetailScreen';

const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();
const mockRefetch = jest.fn();
const mockRemoveTicket = jest.fn();
const mockUseDeleteTicket = jest.fn();

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    setOptions: mockSetOptions,
  }),
  useRoute: () => ({ params: { ticketId: 'ticket-1' } }),
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

jest.mock('../../features/ticket/api/useGetTickets', () => ({
  useGetTicket: jest.fn(),
  useGetTicketGameSnapshot: jest.fn(),
}));

jest.mock('../../features/ticket/api/useDeleteTicket', () => ({
  useDeleteTicket: () => mockUseDeleteTicket(),
}));

jest.mock('../../features/ticket/api/useSetTicketPageOrientation.ts', () => ({
  useSetTicketPageOrientation: () => ({
    mutateAsync: jest.fn(),
    data: undefined,
    isPending: false,
  }),
}));

jest.mock('./components/TicketRecordPage.tsx', () => {
  const { Text } = require('react-native');
  return function MockTicketRecordPage({ ticket }: any) {
    return <Text>{`경기 기록 ${ticket.id}`}</Text>;
  };
});

jest.mock('./components/diary/TicketDiaryPage.tsx', () => {
  const ReactMock = require('react');
  return ReactMock.forwardRef(() => null);
});

jest.mock('./components/TicketPageOrientationSheet.tsx', () => {
  const { Text } = require('react-native');
  return function MockTicketPageOrientationSheet({ visible }: any) {
    return visible ? <Text>페이지 방향 선택</Text> : null;
  };
});

jest.mock('../../components/common/AppPopoverMenu.tsx', () => {
  const { Pressable, Text } = require('react-native');

  return function MockAppPopoverMenu({ visible, actions }: any) {
    if (!visible) return null;

    return actions.map((action: any) => (
      <Pressable
        key={action.label}
        onPress={action.onPress}
        accessibilityRole="button"
        accessibilityLabel={action.label}
      >
        <Text>{action.label}</Text>
      </Pressable>
    ));
    서;
  };
});

const ticket = {
  id: 'ticket-1',
  pageOrientation: null,
  matchDate: '2026-08-03',
  matchTime: '18:30',
  stadiumName: '잠실',
  seatName: '네이비석',
  seatDetail: '309블록',
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
};

describe('TicketDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGetTicket as jest.Mock).mockReturnValue({
      data: ticket,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
    (useGetTicketGameSnapshot as jest.Mock).mockReturnValue({
      data: undefined,
    });
    mockUseDeleteTicket.mockReturnValue({
      mutateAsync: mockRemoveTicket,
      isPending: false,
    });
  });

  afterEach(cleanup);

  it('경로의 ID로 티켓 한 건을 조회해 상세와 페이지 방향 선택을 보여준다', async () => {
    await render(<TicketDetailScreen />);

    expect(useGetTicket).toHaveBeenCalledWith('ticket-1');
    expect(screen.getByText('경기 기록 ticket-1')).toBeVisible();
    expect(screen.getByText('페이지 방향 선택')).toBeVisible();
  });

  it('티켓을 조회하는 동안 로딩 상태를 보여준다', async () => {
    (useGetTicket as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
    });

    await render(<TicketDetailScreen />);

    expect(screen.getByText('티켓 정보를 불러오고 있어요')).toBeVisible();
  });

  it('티켓 조회에 실패하면 사용자가 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    (useGetTicket as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    await render(<TicketDetailScreen />);
    await user.press(screen.getByRole('button', { name: '다시 시도' }));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('삭제되었거나 접근할 수 없는 티켓이면 없는 기록으로 안내한다', async () => {
    (useGetTicket as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });

    await render(<TicketDetailScreen />);

    expect(screen.getByText('티켓을 찾을 수 없어요')).toBeVisible();
  });

  it('티켓을 삭제하는 동안 확인창을 닫거나 다시 삭제할 수 없다', async () => {
    const user = userEvent.setup();
    mockUseDeleteTicket.mockReturnValue({
      mutateAsync: mockRemoveTicket,
      isPending: true,
    });

    await render(<TicketDetailScreen />);
    await user.press(screen.getByRole('button', { name: '직관 기록 메뉴' }));
    await user.press(screen.getByRole('button', { name: '티켓 삭제' }));

    expect(screen.getByRole('button', { busy: true })).toBeDisabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
  });
});
