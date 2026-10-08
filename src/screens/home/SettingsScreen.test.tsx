import React from 'react';
import { Alert, Linking } from 'react-native';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import SettingsScreen from './SettingsScreen';
import { useAuth } from '../../features/auth/AuthProvider';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSignOut = jest.fn();
const mockDeleteAccount = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));
jest.mock('../../features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('react-native-device-info', () => ({ getVersion: () => '1.0.0' }));

describe('설정 화면', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signOut: mockSignOut,
      deleteAccount: mockDeleteAccount,
    });
    mockSignOut.mockResolvedValue(undefined);
    mockDeleteAccount.mockResolvedValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('뒤로 가면 프로필로 돌아간다', async () => {
    const user = userEvent.setup();
    await render(<SettingsScreen />);
    await user.press(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      '이용약관',
      'https://amenable-colby-ae6.notion.site/3b6f2bd020d08050b594d22630e4a866',
    ],
    [
      '개인정보 처리방침',
      'https://amenable-colby-ae6.notion.site/3b5f2bd020d0803da252e68a09189ae5',
    ],
  ])('%s 메뉴에서 해당 문서를 연다', async (title, uri) => {
    const user = userEvent.setup();
    await render(<SettingsScreen />);
    await user.press(screen.getByRole('button', { name: title }));
    expect(mockNavigate).toHaveBeenCalledWith('Document', { title, uri });
  });

  it('앱 버전은 이동 버튼 없이 확인할 수 있다', async () => {
    await render(<SettingsScreen />);
    expect(screen.getByText('앱 버전 1.0.0')).toBeVisible();
    expect(screen.queryByRole('button', { name: /앱 버전/ })).toBeNull();
  });

  it('로그아웃 확인을 취소하면 로그인 상태를 유지한다', async () => {
    const user = userEvent.setup();
    await render(<SettingsScreen />);
    await user.press(screen.getByRole('button', { name: '로그아웃' }));
    await user.press(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('button', { name: '취소' })).toBeNull();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('로그아웃을 확인하면 한 번만 로그아웃한다', async () => {
    const user = userEvent.setup();
    await render(<SettingsScreen />);
    await user.press(screen.getByRole('button', { name: '로그아웃' }));
    await user.press(screen.getAllByRole('button', { name: '로그아웃' })[1]);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: '취소' })).toBeNull();
  });

  it('로그아웃 처리 중에는 다시 로그아웃을 시작하지 않는다', async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    mockSignOut.mockReturnValueOnce(
      new Promise<void>(resolve => {
        finish = resolve;
      }),
    );
    await render(<SettingsScreen />);
    await user.press(screen.getByRole('button', { name: '로그아웃' }));
    await user.press(screen.getAllByRole('button', { name: '로그아웃' })[1]);
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeDisabled();
    await user.press(screen.getByRole('button', { name: '로그아웃' }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    await act(async () => finish());
  });

  it('로그아웃 실패를 안내하고 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    mockSignOut.mockRejectedValueOnce(new Error('offline'));
    await render(<SettingsScreen />);
    await user.press(screen.getByRole('button', { name: '로그아웃' }));
    await user.press(screen.getAllByRole('button', { name: '로그아웃' })[1]);
    expect(Alert.alert).toHaveBeenCalledWith(
      '로그아웃하지 못했어요',
      '잠시 후 다시 시도해 주세요.',
    );
    expect(screen.getByRole('button', { name: '로그아웃' })).not.toBeDisabled();
  });

  it('회원 탈퇴를 취소하면 계정을 삭제하지 않는다', async () => {
    const user = userEvent.setup();
    await render(<SettingsScreen />);
    await user.press(screen.getByRole('button', { name: '회원 탈퇴' }));
    await user.press(screen.getByRole('button', { name: '취소' }));
    expect(mockDeleteAccount).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '취소' })).toBeNull();
  });

  it('탈퇴 재인증을 취소하면 확인창을 닫고 설정에 머무른다', async () => {
    const user = userEvent.setup();
    mockDeleteAccount.mockResolvedValueOnce(false);
    await render(<SettingsScreen />);
    await user.press(screen.getByRole('button', { name: '회원 탈퇴' }));
    await user.press(screen.getByRole('button', { name: '탈퇴하기' }));
    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: '취소' })).toBeNull();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('탈퇴 실패 시 오류를 안내하고 재시도를 허용한다', async () => {
    const user = userEvent.setup();
    mockDeleteAccount.mockRejectedValueOnce(new Error('재인증이 필요해요.'));
    await render(<SettingsScreen />);
    await user.press(screen.getByRole('button', { name: '회원 탈퇴' }));
    await user.press(screen.getByRole('button', { name: '탈퇴하기' }));
    expect(Alert.alert).toHaveBeenCalledWith(
      '회원 탈퇴를 완료하지 못했어요',
      '재인증이 필요해요.',
    );
    expect(screen.queryByRole('button', { name: '취소' })).toBeNull();
    expect(
      screen.getByRole('button', { name: '회원 탈퇴' }),
    ).not.toBeDisabled();
  });

  it('탈퇴 처리 중에는 중복 실행과 취소를 막는다', async () => {
    const user = userEvent.setup();
    let finish!: (deleted: boolean) => void;
    mockDeleteAccount.mockReturnValueOnce(
      new Promise<boolean>(resolve => {
        finish = resolve;
      }),
    );
    await render(<SettingsScreen />);
    await user.press(screen.getByRole('button', { name: '회원 탈퇴' }));
    const confirm = screen.getByRole('button', { name: '탈퇴하기' });
    await user.press(confirm);
    await user.press(confirm);
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    await act(async () => finish(false));
    expect(screen.queryByRole('button', { name: '취소' })).toBeNull();
  });
});
