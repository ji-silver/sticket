import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from '../../test-utils';
import { useAuth } from '../../features/auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import ProfileSetupScreen from './ProfileSetupScreen';

jest.mock('@react-navigation/native', () => ({ useNavigation: jest.fn() }));
jest.mock('../../features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn() }, from: jest.fn() },
}));

describe('가입 닉네임 중복 검사', () => {
  const completeProfile = jest.fn();
  const goBack = jest.fn();
  const single = jest.fn();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (useNavigation as jest.Mock).mockReturnValue({ goBack });
    (useAuth as jest.Mock).mockReturnValue({
      session: {
        user: {
          app_metadata: { provider: 'google' },
          user_metadata: { name: '직관팬' },
        },
      },
      profile: null,
      completeProfile,
    });
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    });
    const teamQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: 'lg' }, error: null }),
    };
    (supabase.from as jest.Mock).mockImplementation(table =>
      table === 'teams'
        ? teamQuery
        : { upsert: () => ({ select: () => ({ single }) }) },
    );
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  async function openForm() {
    await render(<ProfileSetupScreen />);
    await fireEvent.press(screen.getByLabelText('응원 구단 선택'));
    await fireEvent.press(await screen.findByLabelText('LG 트윈스 선택'));
    await fireEvent.press(screen.getByLabelText('필수 이용약관 동의'));
    await fireEvent.press(screen.getByLabelText('필수 개인정보 처리방침 동의'));
  }

  const submit = () =>
    userEvent
      .setup()
      .press(screen.getByLabelText('프로필 설정 완료하고 시작하기'));

  it('중복 닉네임이면 안내하고 입력한 정보를 유지하며 다른 닉네임으로 다시 저장할 수 있다', async () => {
    single.mockResolvedValueOnce({
      data: null,
      error: {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "profiles_nickname_unique"',
      },
    });
    await openForm();
    await submit();
    expect(
      await screen.findByText('이미 사용 중인 닉네임이에요'),
    ).toBeVisible();
    expect(alert).not.toHaveBeenCalled();
    expect(completeProfile).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
    expect(screen.getByLabelText('닉네임').props.value).toBe('직관팬');

    const savedProfile = { id: 'user-id', nickname: '새직관팬' };
    single.mockResolvedValueOnce({ data: savedProfile, error: null });
    await fireEvent.changeText(screen.getByLabelText('닉네임'), '새직관팬');
    expect(screen.queryByText('이미 사용 중인 닉네임이에요')).toBeNull();
    await submit();
    await waitFor(() =>
      expect(completeProfile).toHaveBeenCalledWith(savedProfile),
    );
    expect(screen.getByText('LG 트윈스')).toBeVisible();
  });

  it('저장 중 다른 닉네임을 입력하면 이전 요청의 중복 오류를 표시하지 않는다', async () => {
    let finishSave!: (result: unknown) => void;
    single.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishSave = resolve;
        }),
    );
    await openForm();
    await submit();
    await waitFor(() => expect(single).toHaveBeenCalledTimes(1));
    await fireEvent.changeText(screen.getByLabelText('닉네임'), '새직관팬');
    await act(async () => {
      finishSave({
        data: null,
        error: {
          code: '23505',
          message:
            'duplicate key value violates unique constraint "profiles_nickname_unique"',
        },
      });
    });
    await waitFor(() =>
      expect(
        screen.getByLabelText('프로필 설정 완료하고 시작하기'),
      ).not.toBeDisabled(),
    );
    expect(screen.queryByText('이미 사용 중인 닉네임이에요')).toBeNull();
    expect(alert).not.toHaveBeenCalled();
    expect(screen.getByLabelText('닉네임').props.value).toBe('새직관팬');
  });

  it('통신 오류는 닉네임 중복으로 안내하지 않는다', async () => {
    single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST000', message: 'connection failed' },
    });
    await openForm();
    await submit();
    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith(
        '프로필을 저장하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    });
    expect(completeProfile).not.toHaveBeenCalled();
  });
});
