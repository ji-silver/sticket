import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '../../test-utils';
import { Alert } from 'react-native';
import AddTicketScreen from './AddTicketScreen';
import { getGamesByDate } from '../../features/game/game.service';
import { useCreateTicket } from '../../features/ticket/api/useCreateTicket';

const mockGoBack = jest.fn();
const mockUseRoute = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => mockUseRoute(),
}));

jest.mock('../../features/game/game.service.ts', () => ({
  getGamesByDate: jest.fn(),
}));

jest.mock('../../features/ticket/api/useCreateTicket', () => ({
  useCreateTicket: jest.fn(),
}));

jest.mock('../../features/auth/AuthProvider.tsx', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../lib/date.ts', () => ({
  getTodayInKorea: () => '2026-08-03',
}));

jest.mock('../../components/common/AppCalendar.tsx', () => {
  const { View, Pressable, Text } = require('react-native');
  return function MockAppCalendar({ onDayPress }: any) {
    return (
      <View testID="mock-app-calendar">
        <Pressable onPress={() => onDayPress({ dateString: '2026-08-01' })}>
          <Text>Mock Date 1</Text>
        </Pressable>
        <Pressable onPress={() => onDayPress({ dateString: '2026-08-02' })}>
          <Text>Mock Date 2</Text>
        </Pressable>
        <Pressable onPress={() => onDayPress({ dateString: '2026-08-04' })}>
          <Text>Mock Date 4</Text>
        </Pressable>
      </View>
    );
  };
});

jest.mock('./components/OriginalTicketImageField.tsx', () => {
  const { View } = require('react-native');
  return function MockOriginalTicketImageField() {
    return <View testID="mock-original-ticket-image-field" />;
  };
});

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

afterEach(() => {
  cleanup();
});

describe('AddTicketScreen', () => {
  const mockMutateAsync = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    jest.clearAllMocks();

    (useCreateTicket as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
    mockUseRoute.mockReturnValue({ params: { initialDate: undefined } });
    mockUseAuth.mockReturnValue({
      profile: { favorite_team: { short_name: '키움' } },
    });
  });

  const setup = async () => {
    return render(<AddTicketScreen />);
  };

  describe('화면 초기화 및 렌더링', () => {
    it('초기 날짜가 없으면 기본적으로 캘린더를 보여준다', async () => {
      await setup();

      expect(screen.getByText('직관 날짜')).toBeVisible();
      expect(screen.queryByText('어떤 경기를 봤나요?')).toBeNull();
    });

    it('초기 날짜 파라미터가 주어지면 캘린더가 닫혀 있고, 해당 날짜의 경기를 즉시 불러온다', async () => {
      mockUseRoute.mockReturnValue({ params: { initialDate: '2026-08-01' } });
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([]);

      await setup();

      expect(screen.queryByTestId('mock-app-calendar')).toBeNull();
      expect(screen.getByText('어떤 경기를 봤나요?')).toBeVisible();

      await waitFor(() => {
        expect(getGamesByDate).toHaveBeenCalledWith('2026-08-01');
      });
    });
  });

  describe('달력 및 경기 연동', () => {
    it('응원 구단 경기를 목록의 가장 위에 표시한다', async () => {
      mockUseAuth.mockReturnValue({
        profile: { favorite_team: { short_name: 'LG' } },
      });
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          id: 'other-game',
          awayTeamName: '키움',
          homeTeamName: 'KIA',
          time: '18:30',
          stadiumName: '광주',
        },
        {
          id: 'favorite-game',
          awayTeamName: '두산',
          homeTeamName: 'LG',
          time: '18:30',
          stadiumName: '잠실',
        },
      ]);

      await setup();
      await fireEvent.press(screen.getByText('Mock Date 1'));

      const gameButtons = await screen.findAllByRole('button', {
        name: /원정 대/,
      });

      expect(gameButtons[0].props.accessibilityLabel).toMatch(
        /두산 원정 대 LG 홈/,
      );
    });

    it('응원 구단 경기가 하나면 자동 선택하고 다른 경기로 변경할 수 있다', async () => {
      mockUseAuth.mockReturnValue({
        profile: { favorite_team: { short_name: 'LG' } },
      });
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          id: 'favorite-game',
          awayTeamName: '두산',
          homeTeamName: 'LG',
          time: '18:30',
          stadiumName: '잠실',
        },
        {
          id: 'other-game',
          awayTeamName: '키움',
          homeTeamName: 'KIA',
          time: '18:30',
          stadiumName: '광주',
        },
      ]);

      await setup();
      await fireEvent.press(screen.getByText('Mock Date 1'));

      const favoriteGame = await screen.findByRole('button', {
        name: /두산 원정 대 LG 홈/,
      });
      const otherGame = screen.getByRole('button', {
        name: /키움 원정 대 KIA 홈/,
      });

      await waitFor(() => {
        expect(favoriteGame.props.accessibilityState).toMatchObject({
          selected: true,
        });
      });

      await fireEvent.press(otherGame);

      await waitFor(() => {
        expect(
          screen.getByRole('button', {
            name: /키움 원정 대 KIA 홈/,
          }).props.accessibilityState,
        ).toMatchObject({ selected: true });
        expect(
          screen.getByRole('button', {
            name: /두산 원정 대 LG 홈/,
          }).props.accessibilityState,
        ).toMatchObject({ selected: false });
      });
    });

    it('현재 시즌 정규 홈경기에는 시즌권 좌석을 채우고 다른 좌석으로 바꿀 수 있다', async () => {
      mockUseAuth.mockReturnValue({
        profile: {
          favorite_team_id: 'lg',
          favorite_team: { short_name: 'LG' },
          season_ticket_seat_name: '1루 응원지정석 23블록',
          season_ticket_season: 2026,
          season_ticket_team_id: 'lg',
        },
      });
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          id: 'home-game',
          date: '2026-08-01',
          season: 2026,
          seriesType: 'REGULAR',
          awayTeamId: 'doosan',
          homeTeamId: 'lg',
          awayTeamName: '두산',
          homeTeamName: 'LG',
          time: '18:30',
          stadiumName: '잠실',
        },
        {
          id: 'away-game',
          date: '2026-08-01',
          season: 2026,
          seriesType: 'REGULAR',
          awayTeamId: 'lg',
          homeTeamId: 'doosan',
          awayTeamName: 'LG',
          homeTeamName: '두산',
          time: '14:00',
          stadiumName: '잠실',
        },
      ]);

      await setup();
      await fireEvent.press(screen.getByText('Mock Date 1'));

      await fireEvent.press(
        await screen.findByRole('button', { name: /두산 원정 대 LG 홈/ }),
      );
      await waitFor(() => {
        expect(screen.getByLabelText('좌석 정보').props.value).toBe(
          '1루 응원지정석 23블록',
        );
      });

      await fireEvent.press(
        screen.getByRole('button', { name: /LG 원정 대 두산 홈/ }),
      );
      await waitFor(() => {
        expect(screen.getByLabelText('좌석 정보').props.value).toBe('');
      });

      await fireEvent.press(
        screen.getByRole('button', { name: /두산 원정 대 LG 홈/ }),
      );
      await waitFor(() => {
        expect(screen.getByLabelText('좌석 정보').props.value).toBe(
          '1루 응원지정석 23블록',
        );
      });

      await fireEvent.changeText(
        screen.getByLabelText('좌석 정보'),
        '테이블석 3열',
      );
      await waitFor(() => {
        expect(screen.getByLabelText('좌석 정보').props.value).toBe(
          '테이블석 3열',
        );
      });

      await fireEvent.press(
        screen.getByRole('button', { name: '티켓 추가' }),
      );

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          gameKey: 'home-game',
          seatName: '테이블석 3열',
          originalPhotoBase64: undefined,
        });
      });
    });

    it('달력에서 날짜를 선택하면, 해당 날짜의 경기를 서버에서 불러온다', async () => {
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          id: 'g1',
          awayTeamName: '두산',
          homeTeamName: 'LG',
          time: '18:30',
          stadiumName: '잠실',
        },
      ]);

      await setup();

      const dayButton = screen.getByText('Mock Date 1');
      await fireEvent.press(dayButton);

      await waitFor(() => {
        expect(getGamesByDate).toHaveBeenCalledWith('2026-08-01');
      });

      expect(await screen.findByText('두산')).toBeVisible();
      expect(screen.getByText('LG')).toBeVisible();
    });

    it('선택한 날짜에 경기가 없으면, 빈 상태 안내를 보여준다', async () => {
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([]);

      await setup();

      const dayButton = screen.getByText('Mock Date 2');
      await fireEvent.press(dayButton);

      await waitFor(() => {
        expect(getGamesByDate).toHaveBeenCalledWith('2026-08-02');
      });

      expect(
        await screen.findByText('이 날짜에는 경기가 없어요'),
      ).toBeVisible();
    });

    it('경기 정보를 불러오는데 실패하면, 에러 안내를 보여준다', async () => {
      (getGamesByDate as jest.Mock).mockRejectedValueOnce(
        new Error('Network Error'),
      );

      await setup();

      const dayButton = screen.getByText('Mock Date 2');
      await fireEvent.press(dayButton);

      expect(
        await screen.findByText('경기 정보를 불러오지 못했어요'),
      ).toBeVisible();
    });
  });

  describe('유효성 검사 및 티켓 추가', () => {
    it('경기를 선택하지 않으면 티켓 추가 버튼은 비활성화 상태여야 한다', async () => {
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          id: 'g1',
          awayTeamName: '두산',
          homeTeamName: 'LG',
          time: '18:30',
          stadiumName: '잠실',
        },
      ]);

      await setup();

      const dayButton = screen.getByText('Mock Date 1');
      await fireEvent.press(dayButton);

      await screen.findByText('두산');

      const addButton = screen.getByRole('button', { name: '티켓 추가' });
      expect(addButton).toBeDisabled();
    });

    it('경기를 선택하고 추가 버튼을 누르면 정상적으로 API가 호출되고 뒤로 가기가 수행된다', async () => {
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          id: 'g1',
          awayTeamName: '두산',
          homeTeamName: 'LG',
          time: '18:30',
          stadiumName: '잠실',
        },
      ]);

      await setup();

      const dayButton = screen.getByText('Mock Date 1');
      await fireEvent.press(dayButton);

      const gameButton = await screen.findByRole('button', {
        name: /두산 원정 대 LG 홈/,
      });
      await fireEvent.press(gameButton);

      const addButton = screen.getByRole('button', { name: '티켓 추가' });

      await waitFor(() => {
        expect(addButton).not.toBeDisabled();
      });

      await fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          gameKey: 'g1',
          seatName: '',
          originalPhotoBase64: undefined,
        });
      });

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('중복 등록된 경기일 경우, 에러 팝업을 띄우고 화면에 머무른다', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          id: 'g1',
          awayTeamName: '두산',
          homeTeamName: 'LG',
          time: '18:30',
          stadiumName: '잠실',
        },
      ]);
      mockMutateAsync.mockRejectedValueOnce({ code: '23505' });
      await setup();

      const dayButton = screen.getByText('Mock Date 1');
      await fireEvent.press(dayButton);

      const gameButton = await screen.findByRole('button', {
        name: /두산 원정 대 LG 홈/,
      });
      await fireEvent.press(gameButton);

      const addButton = screen.getByRole('button', { name: '티켓 추가' });

      await waitFor(() => {
        expect(addButton).not.toBeDisabled();
      });

      await fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      expect(mockGoBack).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        '이미 등록한 경기예요',
        '같은 티켓북에는 동일한 경기를 한 번만 등록할 수 있어요.',
      );
      consoleError.mockRestore();
    });
  });
});
