import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '../../test-utils';
import { Alert } from 'react-native';
import AddTicketScreen from './AddTicketScreen';
import { getGamesByDate } from '../../features/game/game.service';
import { useCreateTicket } from '../../features/ticket/api/useCreateTicket';
import {
  INCHEON_SEAT_NAMES,
  LG_SEAT_NAMES,
} from '../../features/ticket/seatCatalog.ts';
import { recognizeTicketText } from '../../features/ticket/ticketOcr.service.ts';

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

jest.mock('../../features/ticket/ticketOcr.service.ts', () => ({
  recognizeTicketText: jest.fn(),
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
  const { Pressable, Text, View } = require('react-native');
  return function MockOriginalTicketImageField({ onChange, isReading }: any) {
    const selectImage = (uri: string) =>
      onChange({ uri, base64: `${uri}-base64`, aspectRatio: 0.7 });

    return (
      <View testID="mock-original-ticket-image-field">
        {isReading ? (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="티켓 정보 확인 중"
          >
            <Text>정보 확인 중</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="테스트 티켓 사진 선택"
          onPress={() => selectImage('/tmp/ticket.jpg')}
        >
          <Text>테스트 티켓 사진</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="두 번째 티켓 사진 선택"
          onPress={() => selectImage('/tmp/ticket-2.jpg')}
        >
          <Text>두 번째 티켓 사진</Text>
        </Pressable>
      </View>
    );
  };
});

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

afterEach(() => {
  cleanup();
});

describe('AddTicketScreen', () => {
  const mockMutateAsync = jest.fn().mockResolvedValue({});
  const mockRecognizeTicketText = recognizeTicketText as jest.MockedFunction<
    typeof recognizeTicketText
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockReset().mockResolvedValue({});
    (getGamesByDate as jest.Mock).mockReset();
    mockRecognizeTicketText.mockReset().mockResolvedValue('');

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
    it('더블헤더 경기에는 차전과 시간을 함께 표시한다', async () => {
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          id: '20250511-kia-ssg-1',
          awayTeamName: 'KIA',
          homeTeamName: 'SSG',
          time: '14:00',
          stadiumName: '인천 SSG랜더스필드',
        },
        {
          id: '20250511-kia-ssg-2',
          awayTeamName: 'KIA',
          homeTeamName: 'SSG',
          time: '18:30',
          stadiumName: '인천 SSG랜더스필드',
        },
      ]);

      await setup();
      await fireEvent.press(screen.getByText('Mock Date 1'));

      expect(await screen.findByText('1차전 14:00')).toBeVisible();
      expect(screen.getByText('2차전 18:30')).toBeVisible();
    });

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
        expect(screen.getByLabelText('좌석명').props.value).toBe(
          '1루 응원지정석 23블록',
        );
      });

      await fireEvent.press(
        screen.getByRole('button', { name: /LG 원정 대 두산 홈/ }),
      );
      await waitFor(() => {
        expect(screen.getByLabelText('좌석명').props.value).toBe('');
      });

      await fireEvent.press(
        screen.getByRole('button', { name: /두산 원정 대 LG 홈/ }),
      );
      await waitFor(() => {
        expect(screen.getByLabelText('좌석명').props.value).toBe(
          '1루 응원지정석 23블록',
        );
      });

      await fireEvent.changeText(
        screen.getByLabelText('좌석명'),
        '테이블석 3열',
      );
      await waitFor(() => {
        expect(screen.getByLabelText('좌석명').props.value).toBe(
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
          seatDetail: '',
          originalPhotoBase64: undefined,
        });
      });
    });

    it('인천구장에서는 좌석명을 선택하거나 직접 입력하고 상세 위치를 따로 남긴다', async () => {
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          id: 'incheon-game',
          awayTeamName: 'LG',
          homeTeamName: 'SSG',
          time: '18:30',
          stadiumName: '인천 SSG랜더스필드',
        },
      ]);

      await setup();
      await fireEvent.press(screen.getByText('Mock Date 1'));
      await fireEvent.press(
        await screen.findByRole('button', { name: /LG 원정 대 SSG 홈/ }),
      );

      expect(screen.getByPlaceholderText('좌석명 직접 입력')).toBeVisible();
      expect(
        screen.getByPlaceholderText('블록 열 좌석 번호 입력'),
      ).toBeVisible();
      expect(screen.queryByText('좌석명')).not.toBeOnTheScreen();
      expect(screen.queryByText('상세 위치')).not.toBeOnTheScreen();

      await fireEvent.changeText(
        screen.getByLabelText('좌석명'),
        '현장 안내 좌석',
      );
      expect(screen.getByLabelText('좌석명').props.value).toBe(
        '현장 안내 좌석',
      );

      await fireEvent.press(
        screen.getByRole('button', { name: '좌석명 목록 열기' }),
      );
      expect(screen.queryByText('직접 입력')).not.toBeOnTheScreen();
      const selectedSeatName = INCHEON_SEAT_NAMES[0];
      await fireEvent.press(screen.getByText(selectedSeatName));
      await fireEvent.changeText(
        screen.getByLabelText('상세 위치'),
        '9블록 J열 12번',
      );

      await fireEvent.press(
        screen.getByRole('button', { name: '티켓 추가' }),
      );

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          gameKey: 'incheon-game',
          seatName: selectedSeatName,
          seatDetail: '9블록 J열 12번',
          originalPhotoBase64: undefined,
        });
      });
    });

    it('잠실 LG 홈경기에서는 LG 좌석명 목록을 보여준다', async () => {
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          id: 'seoul-game',
          awayTeamName: 'SSG',
          homeTeamName: 'LG',
          time: '18:30',
          stadiumName: '잠실',
        },
      ]);

      await setup();
      await fireEvent.press(screen.getByText('Mock Date 1'));
      await fireEvent.press(
        await screen.findByRole('button', { name: /SSG 원정 대 LG 홈/ }),
      );

      await fireEvent.press(
        screen.getByRole('button', { name: '좌석명 목록 열기' }),
      );

      expect(screen.getByText(LG_SEAT_NAMES[0])).toBeVisible();
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

  describe('원본 티켓 OCR', () => {
    const jamsilGame = {
      id: '20260801-doosan-lg',
      date: '2026-08-01',
      time: '18:30',
      season: 2026,
      seriesType: 'REGULAR',
      stadiumName: '잠실',
      awayTeamId: 'doosan',
      homeTeamId: 'lg',
      awayTeamName: '두산',
      homeTeamName: 'LG',
      awayScore: null,
      homeScore: null,
    };

    const lgSsgTicketText =
      'LG TWINS vs SSG\n2022년 06월 04일(토) 17:00\n3루 블루석\n116블록 10열 117번';

    it('구장명이 없어도 팀명으로 경기를 선택하고 좌석을 채운다', async () => {
      mockRecognizeTicketText.mockResolvedValue(lgSsgTicketText);
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          ...jamsilGame,
          id: '20220604-ssg-lg',
          date: '2022-06-04',
          time: '17:00',
          awayTeamId: 'ssg',
          homeTeamId: 'lg',
          awayTeamName: 'SSG',
          homeTeamName: 'LG',
        },
      ]);

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );

      expect(await screen.findByText(/2022년 6월 4일/)).toBeVisible();
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /SSG 원정 대 LG 홈/ }).props
            .accessibilityState,
        ).toMatchObject({ selected: true });
        expect(screen.getByLabelText('좌석명').props.value).toBe('블루석');
        expect(screen.getByLabelText('상세 위치').props.value).toBe(
          '116블록 10열 117번',
        );
      });
    });

    it('경기를 찾지 못해도 인식한 좌석 정보는 채운다', async () => {
      mockRecognizeTicketText.mockResolvedValue(lgSsgTicketText);
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([]);

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );

      expect(await screen.findByText(/2022년 6월 4일/)).toBeVisible();
      await waitFor(() => {
        expect(screen.getByLabelText('좌석명').props.value).toBe('블루석');
        expect(screen.getByLabelText('상세 위치').props.value).toBe(
          '116블록 10열 117번',
        );
      });
    });

    it('날짜를 읽지 못해도 좌석은 보관했다가 날짜 선택 후 표시한다', async () => {
      mockRecognizeTicketText.mockResolvedValue(
        '3루 블루석\n116블록 10열 117번',
      );
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([]);

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );
      await fireEvent.press(screen.getByText('Mock Date 1'));

      await waitFor(() => {
        expect(screen.getByLabelText('좌석명').props.value).toBe('블루석');
        expect(screen.getByLabelText('상세 위치').props.value).toBe(
          '116블록 10열 117번',
        );
      });
    });

    it('인천 티켓에서 경기와 좌석을 선택하고 좌석 목록도 사용할 수 있다', async () => {
      mockRecognizeTicketText.mockResolvedValue(
        '인천 SSG 랜더스필드\n2026년 05월 01일(금) 17:00\n1루 으쓱이존\n2B블럭 G열 8번',
      );
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        {
          ...jamsilGame,
          id: '20260501-lotte-ssg',
          date: '2026-05-01',
          stadiumName: '문학',
          awayTeamId: 'lotte',
          homeTeamId: 'ssg',
          awayTeamName: '롯데',
          homeTeamName: 'SSG',
        },
      ]);

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );

      expect(await screen.findByText(/2026년 5월 1일/)).toBeVisible();
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /롯데 원정 대 SSG 홈/ }).props
            .accessibilityState,
        ).toMatchObject({ selected: true });
        expect(screen.getByLabelText('좌석명').props.value).toBe('으쓱이존');
        expect(screen.getByLabelText('상세 위치').props.value).toBe(
          '2B블럭 G열 8번',
        );
        expect(
          screen.getByRole('button', { name: '좌석명 목록 열기' }),
        ).toBeVisible();
      });
    });

    it('사진을 읽는 동안 원본 티켓 영역에 진행 상태를 표시한다', async () => {
      let resolveOcr!: (text: string) => void;
      mockRecognizeTicketText.mockReturnValue(
        new Promise(resolve => {
          resolveOcr = resolve;
        }),
      );

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );

      expect(
        screen.getByLabelText('티켓 정보 확인 중'),
      ).toBeVisible();
      expect(screen.queryByText('티켓 정보를 읽고 있어요')).not.toBeOnTheScreen();

      await act(async () => {
        resolveOcr('');
      });
    });

    it('사진에서 날짜와 구장이 하나로 확인되면 해당 경기와 좌석을 채운다', async () => {
      mockRecognizeTicketText.mockResolvedValue(
        '2026.08.01\n잠실야구장\n오렌지석 112블럭 A열 8번',
      );
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([jamsilGame]);

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );

      expect(await screen.findByText(/2026년 8월 1일/)).toBeVisible();
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /두산 원정 대 LG 홈/ }).props
            .accessibilityState,
        ).toMatchObject({ selected: true });
        expect(screen.getByLabelText('좌석명').props.value).toBe('오렌지석');
        expect(screen.getByLabelText('상세 위치').props.value).toBe(
          '112블럭 A열 8번',
        );
      });
      expect(screen.queryByText(/내용을 확인해 주세요/)).not.toBeOnTheScreen();
    });

    it('같은 날짜와 구장의 경기가 둘이면 어느 경기도 선택하지 않는다', async () => {
      mockRecognizeTicketText.mockResolvedValue('2026.08.01\n잠실야구장');
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        { ...jamsilGame, id: '20260801-doosan-lg-1', time: '14:00' },
        { ...jamsilGame, id: '20260801-doosan-lg-2', time: '18:30' },
      ]);

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );

      const gameButtons = await screen.findAllByRole('button', {
        name: /두산 원정 대 LG 홈/,
      });
      expect(gameButtons).toHaveLength(2);
      gameButtons.forEach(button => {
        expect(button.props.accessibilityState).toMatchObject({
          selected: false,
        });
      });
    });

    it('날짜나 구장이 여러 개면 자동 입력하지 않는다', async () => {
      mockRecognizeTicketText.mockResolvedValue(
        '2026.08.01 2026.08.02\n잠실야구장 고척스카이돔',
      );

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );

      await waitFor(() => {
        expect(mockRecognizeTicketText).toHaveBeenCalled();
      });
      expect(screen.queryByText(/2026년 8월/)).not.toBeOnTheScreen();
      expect(getGamesByDate).not.toHaveBeenCalled();
    });

    it('사용자가 고른 날짜와 OCR 날짜가 다르면 OCR 결과를 적용하지 않는다', async () => {
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([jamsilGame]);
      mockRecognizeTicketText.mockResolvedValue('2026.08.01\n잠실야구장');

      await setup();
      await fireEvent.press(screen.getByText('Mock Date 2'));
      await screen.findByText(/2026년 8월 2일/);
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );

      expect(screen.getByText(/2026년 8월 2일/)).toBeVisible();
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /두산 원정 대 LG 홈/ }).props
            .accessibilityState,
        ).toMatchObject({ selected: false });
      });
    });

    it('OCR 진행 중 사용자가 입력한 좌석을 완료 후에도 유지한다', async () => {
      let resolveOcr!: (text: string) => void;
      mockUseRoute.mockReturnValue({ params: { initialDate: '2026-08-01' } });
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([jamsilGame]);
      mockRecognizeTicketText.mockReturnValue(
        new Promise(resolve => {
          resolveOcr = resolve;
        }),
      );

      await setup();
      await fireEvent.press(
        await screen.findByRole('button', { name: /두산 원정 대 LG 홈/ }),
      );
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );
      await fireEvent.changeText(screen.getByLabelText('좌석명'), '내 좌석');
      await fireEvent.changeText(screen.getByLabelText('상세 위치'), '직접 입력');

      await act(async () => {
        resolveOcr('2026.08.01\n잠실야구장\n오렌지석 112블럭 A열 8번');
      });

      expect(screen.getByLabelText('좌석명').props.value).toBe('내 좌석');
      expect(screen.getByLabelText('상세 위치').props.value).toBe(
        '직접 입력',
      );
      expect(
        screen.getByText('일부 항목은 직접 입력해 주세요'),
      ).toBeVisible();
    });

    it('OCR 구장 경기는 기존 선호팀 자동 선택보다 우선한다', async () => {
      let resolveOcr!: (text: string) => void;
      const gwangjuGame = {
        ...jamsilGame,
        id: '20260801-ssg-kia',
        stadiumName: '광주기아챔피언스필드',
        awayTeamId: 'ssg',
        homeTeamId: 'kia',
        awayTeamName: 'SSG',
        homeTeamName: 'KIA',
      };
      mockUseRoute.mockReturnValue({ params: { initialDate: '2026-08-01' } });
      mockUseAuth.mockReturnValue({
        profile: { favorite_team: { short_name: 'LG' } },
      });
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([
        jamsilGame,
        gwangjuGame,
      ]);
      mockRecognizeTicketText.mockReturnValue(
        new Promise(resolve => {
          resolveOcr = resolve;
        }),
      );

      await setup();
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /두산 원정 대 LG 홈/ }).props
            .accessibilityState,
        ).toMatchObject({ selected: true });
      });
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );
      expect(
        screen.getByRole('button', { name: /두산 원정 대 LG 홈/ }).props
          .accessibilityState,
      ).toMatchObject({ selected: true });

      await act(async () => {
        resolveOcr('2026.08.01\n광주기아챔피언스필드');
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /SSG 원정 대 KIA 홈/ }).props
            .accessibilityState,
        ).toMatchObject({ selected: true });
        expect(
          screen.getByRole('button', { name: /두산 원정 대 LG 홈/ }).props
            .accessibilityState,
        ).toMatchObject({ selected: false });
      });
    });

    it('사진을 바꾸면 이전 OCR 좌석을 새 사진의 좌석으로 교체한다', async () => {
      mockUseRoute.mockReturnValue({ params: { initialDate: '2026-08-01' } });
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([jamsilGame]);
      mockRecognizeTicketText
        .mockResolvedValueOnce(
          '2026.08.01\n잠실야구장\n오렌지석 112블록 A열 8번',
        )
        .mockResolvedValueOnce(
          '2026.08.01\n잠실야구장\n블루석 116블록 10열 117번',
        );

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );
      await waitFor(() => {
        expect(screen.getByLabelText('좌석명').props.value).toBe('오렌지석');
      });

      await fireEvent.press(
        screen.getByRole('button', { name: '두 번째 티켓 사진 선택' }),
      );

      await waitFor(() => {
        expect(screen.getByLabelText('좌석명').props.value).toBe('블루석');
        expect(screen.getByLabelText('상세 위치').props.value).toBe(
          '116블록 10열 117번',
        );
      });
    });

    it('바꾼 사진을 인식하지 못하면 이전 OCR 좌석을 남기지 않는다', async () => {
      mockUseRoute.mockReturnValue({ params: { initialDate: '2026-08-01' } });
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([jamsilGame]);
      mockRecognizeTicketText
        .mockResolvedValueOnce(
          '2026.08.01\n잠실야구장\n오렌지석 112블록 A열 8번',
        )
        .mockResolvedValueOnce('');

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );
      await waitFor(() => {
        expect(screen.getByLabelText('좌석명').props.value).toBe('오렌지석');
      });

      await fireEvent.press(
        screen.getByRole('button', { name: '두 번째 티켓 사진 선택' }),
      );

      expect(
        await screen.findByText('티켓 정보를 인식하지 못했어요'),
      ).toBeVisible();
      expect(screen.getByLabelText('좌석명').props.value).toBe('');
      expect(screen.getByLabelText('상세 위치').props.value).toBe('');
    });

    it('첫 사진 인식이 늦게 끝나도 두 번째 사진 결과를 덮어쓰지 않는다', async () => {
      let resolveFirstOcr!: (text: string) => void;
      mockRecognizeTicketText
        .mockReturnValueOnce(
          new Promise(resolve => {
            resolveFirstOcr = resolve;
          }),
        )
        .mockResolvedValueOnce('2026.08.02\n광주기아챔피언스필드');
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([]);

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );
      await fireEvent.press(
        screen.getByRole('button', { name: '두 번째 티켓 사진 선택' }),
      );
      expect(await screen.findByText(/2026년 8월 2일/)).toBeVisible();
      expect(
        await screen.findByText('이 날짜에는 경기가 없어요'),
      ).toBeVisible();

      await act(async () => {
        resolveFirstOcr('2026.08.01\n잠실야구장');
      });

      expect(screen.getByText(/2026년 8월 2일/)).toBeVisible();
      expect(screen.queryByText(/2026년 8월 1일/)).not.toBeOnTheScreen();
    });

    it('OCR이 실패해도 날짜를 골라 티켓을 저장할 수 있다', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockRecognizeTicketText.mockRejectedValue(new Error('Vision failed'));
      (getGamesByDate as jest.Mock).mockResolvedValueOnce([jamsilGame]);

      await setup();
      await fireEvent.press(
        screen.getByRole('button', { name: '테스트 티켓 사진 선택' }),
      );
      expect(
        await screen.findByText('티켓 정보를 인식하지 못했어요'),
      ).toBeVisible();

      await fireEvent.press(screen.getByText('Mock Date 1'));
      await fireEvent.press(
        await screen.findByRole('button', { name: /두산 원정 대 LG 홈/ }),
      );
      await fireEvent.press(
        screen.getByRole('button', { name: '티켓 추가' }),
      );

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ gameKey: jamsilGame.id }),
        );
      });
      consoleError.mockRestore();
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
          seatDetail: '',
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
