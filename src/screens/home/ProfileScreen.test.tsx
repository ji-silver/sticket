import React, { type ReactElement } from 'react';
import {
  render as renderScreen,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileScreen from './ProfileScreen';
import { useAuth } from '../../features/auth/AuthProvider';
import { getAttendanceSummary } from '../../features/profile/profile.service';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('../../features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../../features/profile/profile.service', () => ({
  getAttendanceSummary: jest.fn(),
}));
jest.mock('react-native-device-info', () => ({ getVersion: () => '1.0.0' }));

function render(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return renderScreen(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

describe('프로필과 직관 성적', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      profile: {
        nickname: '직관팬',
        favorite_team_id: 'lg',
        favorite_team: {
          id: 'lg',
          name: 'LG 트윈스',
          short_name: 'LG',
          sport: 'baseball',
        },
        season_ticket_seat_name: '1루 23블록',
        season_ticket_season: 2026,
        season_ticket_team_id: 'lg',
      },
    });
    (getAttendanceSummary as jest.Mock).mockResolvedValue({
      totalGames: 5,
      wins: 3,
      draws: 1,
      losses: 1,
    });
  });

  it('프로필에는 설정 진입점과 계정 관리 메뉴를 표시하지 않는다', async () => {
    await render(<ProfileScreen />);

    expect(screen.queryByRole('button', { name: '설정' })).toBeNull();
    expect(screen.queryByText('로그아웃')).toBeNull();
    expect(screen.queryByText('회원 탈퇴')).toBeNull();
    expect(screen.queryByText('이용약관')).toBeNull();
    await screen.findByText('75%');
  });

  it('프로필에서 내 정보 수정 화면을 연다', async () => {
    const user = userEvent.setup();
    await render(<ProfileScreen />);
    await user.press(screen.getByRole('button', { name: '프로필 수정' }));
    expect(mockNavigate).toHaveBeenCalledWith('ProfileEdit');
    await screen.findByText('75%');
  });

  it.each(['가나다라마바사아자차', 'WWWWWWWWWW'])(
    '최대 길이 닉네임 %s은 글자를 줄여 한 줄로 표시한다',
    async nickname => {
      const { profile } = useAuth();
      (useAuth as jest.Mock).mockReturnValue({
        profile: { ...profile, nickname },
      });
      await render(<ProfileScreen />);
      await screen.findByText('75%');

      // Jest는 네이티브 글자 배치를 계산하지 않으므로 한 줄 자동 축소 전달을 확인한다.
      // 실제 줄바꿈과 버튼 배치는 시뮬레이터에서 별도로 확인한다.
      const nicknameText = screen.getByText(nickname);
      expect(nicknameText.props.numberOfLines).toBe(1);
      expect(nicknameText.props.adjustsFontSizeToFit).toBe(true);
      expect(
        screen.getByRole('button', { name: '프로필 수정' }),
      ).toBeVisible();
    },
  );

  it('무승부를 제외한 승률과 응원팀 종료 경기 수를 표시한다', async () => {
    await render(<ProfileScreen />);
    expect(await screen.findByText('75%')).toBeVisible();
    expect(screen.getByText('응원팀 종료 경기 5경기')).toBeVisible();
    expect(screen.getByRole('header', { name: '야구' })).toBeVisible();
    expect(screen.getByRole('header', { name: '야구 직관 성적' })).toBeVisible();
    expect(screen.getByText('2026 시즌')).toBeVisible();
    expect(screen.queryByText('2026 시즌 · LG 직관 성적')).toBeNull();
    expect(screen.getByText('무승부는 승률에서 제외돼요.')).toBeVisible();
  });

  it('조회 실패를 기록 없음으로 표시하지 않고 다시 불러올 수 있다', async () => {
    const user = userEvent.setup();
    (getAttendanceSummary as jest.Mock).mockRejectedValueOnce(
      new Error('offline'),
    );
    await render(<ProfileScreen />);

    expect(
      await screen.findByText('직관 성적을 불러오지 못했어요.'),
    ).toBeVisible();
    expect(screen.queryByText('기록 없음')).toBeNull();
    expect(screen.queryByText('응원팀 종료 경기 0경기')).toBeNull();

    await user.press(
      screen.getByRole('button', { name: '직관 성적 다시 불러오기' }),
    );
    expect(await screen.findByText('75%')).toBeVisible();
  });

  it('조회 중에는 기록 없음이나 0경기를 먼저 보여주지 않는다', async () => {
    (getAttendanceSummary as jest.Mock).mockReturnValue(new Promise(() => {}));
    await render(<ProfileScreen />);
    expect(screen.getByLabelText('직관 성적 불러오는 중')).toBeVisible();
    expect(screen.queryByText('기록 없음')).toBeNull();
    expect(screen.queryByText('응원팀 종료 경기 0경기')).toBeNull();
  });

  it('무승부만 있는 경우 경기 기록은 유지하고 승률은 계산하지 않는다', async () => {
    (getAttendanceSummary as jest.Mock).mockResolvedValue({
      totalGames: 2,
      wins: 0,
      draws: 2,
      losses: 0,
    });
    await render(<ProfileScreen />);
    expect(await screen.findByText('응원팀 종료 경기 2경기')).toBeVisible();
    expect(screen.getByLabelText('직관 승률 집계 전')).toHaveTextContent(
      '집계 전',
    );
    expect(screen.getByLabelText('2무')).toBeVisible();
    expect(screen.queryByText('기록 없음')).toBeNull();
  });

  it('종료 경기 기록이 없어도 성적 항목을 유지하고 승률을 0%로 표시하지 않는다', async () => {
    (getAttendanceSummary as jest.Mock).mockResolvedValue({
      totalGames: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    });
    await render(<ProfileScreen />);
    expect(
      await screen.findByText('이번 시즌 응원팀의 종료 경기 기록이 없어요.'),
    ).toBeVisible();
    expect(screen.getByLabelText('0승')).toBeVisible();
    expect(screen.getByLabelText('0무')).toBeVisible();
    expect(screen.getByLabelText('0패')).toBeVisible();
    expect(screen.getByText('직관 승률')).toBeVisible();
    expect(screen.getByLabelText('직관 승률 집계 전')).toHaveTextContent(
      '집계 전',
    );
    expect(screen.queryByText('0%')).toBeNull();
  });

  it('등록한 시즌권 좌석은 조회 정보로 표시한다', async () => {
    await render(<ProfileScreen />);
    expect(screen.getByText('1루 23블록')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: '시즌권 좌석 등록' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: '시즌권 좌석 수정' }),
    ).toBeNull();
    await screen.findByText('75%');
  });

  it('시즌권 좌석이 없으면 프로필 수정 화면에서 등록할 수 있다', async () => {
    const user = userEvent.setup();
    const { profile } = useAuth();
    (useAuth as jest.Mock).mockReturnValue({
      profile: { ...profile, season_ticket_seat_name: null },
    });
    await render(<ProfileScreen />);
    expect(screen.getByText('미등록')).toBeVisible();
    expect(screen.queryByText('등록하기')).toBeNull();
    expect(
      screen.queryByRole('button', { name: '시즌권 좌석 등록' }),
    ).toBeNull();
    await user.press(screen.getByRole('button', { name: '프로필 수정' }));
    expect(mockNavigate).toHaveBeenCalledWith('ProfileEdit');
    await screen.findByText('75%');
  });

  it('프로필 정보가 갱신되면 변경된 닉네임과 응원 구단을 표시한다', async () => {
    const view = await render(<ProfileScreen />);
    await screen.findByText('75%');
    (useAuth as jest.Mock).mockReturnValue({
      profile: {
        nickname: '새닉네임',
        favorite_team_id: 'doosan',
        favorite_team: {
          id: 'doosan',
          name: '두산 베어스',
          short_name: '두산',
          sport: 'baseball',
        },
        season_ticket_seat_name: '1루 23블록',
        season_ticket_season: 2026,
        season_ticket_team_id: 'lg',
      },
    });
    await view.rerender(<ProfileScreen />);
    expect(screen.getByText('새닉네임')).toBeVisible();
    expect(screen.getByText('두산 베어스')).toBeVisible();
    expect(screen.getByText('미등록')).toBeVisible();
    await waitFor(() =>
      expect(getAttendanceSummary).toHaveBeenLastCalledWith('doosan', 2026),
    );
  });

  it('다른 종목의 프로필에 야구 시즌권과 성적 계산 규칙을 적용하지 않는다', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      profile: {
        nickname: '축구팬',
        favorite_team_id: 'soccer-team',
        favorite_team: {
          id: 'soccer-team',
          name: '축구 구단',
          short_name: '축구',
          sport: 'soccer',
        },
        season_ticket_seat_name: '1루 23블록',
        season_ticket_season: 2026,
        season_ticket_team_id: 'soccer-team',
      },
    });
    await render(<ProfileScreen />);
    expect(screen.getByText('축구팬')).toBeVisible();
    expect(screen.queryByText('시즌권 좌석')).toBeNull();
    expect(screen.queryByText('직관 승률')).toBeNull();
    expect(getAttendanceSummary).not.toHaveBeenCalled();
  });
});
