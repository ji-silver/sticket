import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';

import {
  getLastAuthProvider,
  signInWithApple,
  signInWithGoogle,
  signInWithKakao,
} from '../../features/auth/auth.service';
import AuthScreen from './AuthScreen';

jest.mock('../../features/auth/auth.service', () => ({
  getLastAuthProvider: jest.fn(),
  signInWithApple: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithKakao: jest.fn(),
}));

describe('소셜 로그인', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (signInWithApple as jest.Mock).mockResolvedValue(null);
    (signInWithGoogle as jest.Mock).mockResolvedValue(null);
    (signInWithKakao as jest.Mock).mockResolvedValue(null);
    (getLastAuthProvider as jest.Mock).mockResolvedValue(null);
  });

  it('로그인 버튼 높이는 50이다', async () => {
    await render(<AuthScreen />);

    expect(screen.getByLabelText('카카오로 계속하기')).toHaveStyle({
      height: 50,
    });
    expect(screen.getByLabelText('Apple로 계속하기')).toHaveStyle({
      height: 50,
    });
    expect(screen.getByLabelText('Google로 계속하기')).toHaveStyle({
      height: 50,
    });
  });

  it('Apple 로고가 버튼 아래로 벗어나지 않는다', async () => {
    await render(<AuthScreen />);

    expect(screen.getByTestId('apple-login-logo')).toHaveStyle({
      marginTop: 0,
    });
  });

  it('카카오 로그인 버튼을 누르면 카카오 인증을 시작한다', async () => {
    const user = userEvent.setup();
    await render(<AuthScreen />);

    await user.press(screen.getByLabelText('카카오로 계속하기'));

    await waitFor(() => expect(signInWithKakao).toHaveBeenCalledTimes(1));
  });

  it('마지막으로 사용한 로그인 버튼 상단에 최근 로그인 말풍선을 표시한다', async () => {
    (getLastAuthProvider as jest.Mock).mockResolvedValue('google');

    await render(<AuthScreen />);

    expect(
      await screen.findByLabelText('Google 최근 로그인'),
    ).toBeOnTheScreen();
  });

  it('로그인 기록이 없으면 최근 로그인 말풍선을 표시하지 않는다', async () => {
    await render(<AuthScreen />);

    await waitFor(() => expect(getLastAuthProvider).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('최근 로그인')).not.toBeOnTheScreen();
  });
});
