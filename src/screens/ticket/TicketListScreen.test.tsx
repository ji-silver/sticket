import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '../../test-utils';
import { Alert, Button } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import TicketListScreen from './TicketListScreen';
import {
  getTicketsBySeason,
  getTicketSeasonSummaries,
} from '../../features/ticket/ticket.service';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('@react-navigation/core', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (cb: any) => jest.requireActual('react').useEffect(cb, []),
}));

jest.mock('../../features/ticket/ticket.service.ts', () => ({
  getTickets: jest.fn(),
  getTicketSeasonSummaries: jest.fn(),
  getTicketsBySeason: jest.fn(),
}));

jest.mock('./components/TicketCard.tsx', () => {
  const { Pressable, Text } = require('react-native');
  return function MockTicketCard({ ticket, onPress }: any) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={`${ticket.homeTeamName} 경기`}
        testID={`ticket-card-${ticket.id}`}
      >
        <Text>
          {ticket.homeTeamName} vs {ticket.awayTeamName}
        </Text>
      </Pressable>
    );
  };
});

function RerenderHarness() {
  const [, setRenderCount] = React.useState(0);

  return (
    <>
      <TicketListScreen />
      <Button
        title="테스트 재렌더링"
        onPress={() => setRenderCount(count => count + 1)}
      />
    </>
  );
}

describe('TicketListScreen', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
      goBack: jest.fn(),
    });
    (getTicketSeasonSummaries as jest.Mock).mockResolvedValue([]);
    (getTicketsBySeason as jest.Mock).mockResolvedValue([]);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  const setup = async () => {
    return render(<TicketListScreen />);
  };

  describe('데이터 페칭 및 빈 화면 상태 처리', () => {
    it('티켓 데이터가 없으면, 빈 화면 전용 안내 문구와 추가 버튼이 노출된다', async () => {
      await setup();

      await waitFor(() => {
        expect(screen.getByText('아직 남긴 티켓이 없어요')).toBeVisible();
      });
      expect(screen.getByText('첫 직관 티켓을 추가해보세요')).toBeVisible();
    });

    it('빈 화면에서 티켓 추가 버튼을 누르면, 티켓 추가 화면으로 이동한다', async () => {
      await setup();

      const addButton = await screen.findByText('티켓 추가');
      fireEvent.press(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('AddTicket');
    });
  });

  describe('연도별 필터링 기능 검증', () => {
    const mockTickets = [
      {
        id: '1',
        matchDate: '2024-05-10',
        homeTeamName: 'LG',
        awayTeamName: '두산',
      },
      {
        id: '2',
        matchDate: '2024-08-15',
        homeTeamName: 'SSG',
        awayTeamName: '키움',
      },
      {
        id: '3',
        matchDate: '2023-04-01',
        homeTeamName: '기아',
        awayTeamName: '삼성',
      },
    ];

    it('현재 연도와 관계없이 사용자가 기록한 가장 최신 시즌을 기본으로 요청한다', async () => {
      (getTicketSeasonSummaries as jest.Mock).mockResolvedValueOnce([
        { season: 2024, ticketCount: 2 },
        { season: 2023, ticketCount: 1 },
      ]);
      (getTicketsBySeason as jest.Mock).mockImplementation((season: number) =>
        Promise.resolve(
          mockTickets.filter(
            ticket => new Date(ticket.matchDate).getFullYear() === season,
          ),
        ),
      );

      await setup();

      const year2024Tab = await screen.findByText('2024');
      expect(year2024Tab).toBeVisible();

      expect(screen.getByText('LG vs 두산')).toBeVisible();
      expect(screen.getByText('SSG vs 키움')).toBeVisible();
      expect(screen.queryByText('기아 vs 삼성')).toBeNull();
      expect(getTicketsBySeason).toHaveBeenCalledWith(2024);
    });

    it('다른 연도 탭을 선택하면 해당 시즌만 서버에 요청한다', async () => {
      (getTicketSeasonSummaries as jest.Mock).mockResolvedValueOnce([
        { season: 2024, ticketCount: 2 },
        { season: 2023, ticketCount: 1 },
      ]);
      (getTicketsBySeason as jest.Mock).mockImplementation((season: number) =>
        Promise.resolve(
          mockTickets.filter(
            ticket => new Date(ticket.matchDate).getFullYear() === season,
          ),
        ),
      );

      await setup();

      const year2023Tab = await screen.findByText('2023');
      fireEvent.press(year2023Tab);

      const ticket2023 = await screen.findByText('기아 vs 삼성');
      expect(ticket2023).toBeVisible();
      expect(screen.queryByText('LG vs 두산')).toBeNull();
      expect(getTicketsBySeason).toHaveBeenLastCalledWith(2023);
    });
  });

  describe('스크롤 중 월 표시', () => {
    it('티켓이 아닌 항목이 먼저 보여도 유효한 티켓의 월을 표시한다', async () => {
      const ticket = {
        id: '1',
        matchDate: '2024-05-10',
        homeTeamName: 'LG',
        awayTeamName: '두산',
      };
      (getTicketSeasonSummaries as jest.Mock).mockResolvedValueOnce([
        { season: 2024, ticketCount: 1 },
      ]);
      (getTicketsBySeason as jest.Mock).mockResolvedValueOnce([ticket]);

      const view = await setup();
      await screen.findByText('LG vs 두산');

      const [list] = view.container.queryAll(
        instance => typeof instance.props.onViewableItemsChanged === 'function',
      );
      expect(list).toBeDefined();
      await act(async () => {
        list.props.onViewableItemsChanged({
          viewableItems: [
            {
              index: 0,
              key: 'section-header',
              item: { title: '2024' },
              isViewable: true,
            },
            { index: 1, key: ticket.id, item: ticket, isViewable: true },
          ],
          changed: [],
        });
      });

      expect(
        screen.queryByText('NaN월', { includeHiddenElements: true }),
      ).toBeNull();
      expect(
        screen.getByText('5월', { includeHiddenElements: true }),
      ).toBeOnTheScreen();
    });
  });

  describe('네비게이션 흐름', () => {
    const mockTickets = [
      {
        id: '1',
        matchDate: '2024-05-10',
        homeTeamName: 'LG',
        awayTeamName: '두산',
      },
    ];

    it('티켓 카드를 클릭하면 해당 티켓의 상세 화면으로 이동한다', async () => {
      (getTicketSeasonSummaries as jest.Mock).mockResolvedValueOnce([
        { season: 2024, ticketCount: 1 },
      ]);
      (getTicketsBySeason as jest.Mock).mockResolvedValueOnce(mockTickets);

      await setup();

      const ticketCard = await screen.findByLabelText('LG 경기');
      fireEvent.press(ticketCard);

      expect(mockNavigate).toHaveBeenCalledWith('TicketDetail', {
        ticketId: '1',
      });
    });
  });

  describe('에러 핸들링', () => {
    it('데이터를 불러오는 중 에러가 발생하면 안내 알림 팝업이 노출된다', async () => {
      (getTicketSeasonSummaries as jest.Mock).mockRejectedValueOnce(
        new Error('Network Error'),
      );

      await render(<RerenderHarness />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '티켓 목록을 불러오지 못했어요',
          '잠시 후 다시 시도해 주세요.',
        );
      });

      fireEvent.press(screen.getByText('테스트 재렌더링'));

      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });
  });
});
