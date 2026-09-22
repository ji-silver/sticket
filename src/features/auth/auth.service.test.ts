import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { Linking } from 'react-native';

import { supabase } from '../../lib/supabase';
import {
  handleAuthCallback,
  signInWithGoogle,
  signInWithKakao,
} from './auth.service';

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
  },
  isSuccessResponse: jest.fn(),
}));

jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: {
    Error: { CANCELED: 'CANCELED' },
    Operation: { LOGIN: 'LOGIN' },
    Scope: { EMAIL: 'EMAIL' },
  },
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: jest.fn(),
      signInWithIdToken: jest.fn(),
      signInWithOAuth: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

describe('카카오 로그인', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('카카오 OAuth 화면을 열고 로그인 후 스티켓으로 복귀하도록 요청한다', async () => {
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
      data: {
        provider: 'kakao',
        url: 'https://ffvvuetmpkykqqkojorb.supabase.co/auth/v1/authorize',
      },
      error: null,
    });

    await signInWithKakao();

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'kakao',
      options: {
        redirectTo: 'com.jieun.sticket://auth/callback',
        skipBrowserRedirect: true,
      },
    });
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://ffvvuetmpkykqqkojorb.supabase.co/auth/v1/authorize',
    );
  });

  it('앱으로 돌아온 인증 코드를 Supabase 세션으로 교환한다', async () => {
    (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: { session: {}, user: {} },
      error: null,
    });

    const handled = await handleAuthCallback(
      'com.jieun.sticket://auth/callback?code=kakao-auth-code',
    );

    expect(handled).toBe(true);
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      'kakao-auth-code',
    );
  });

  it('스티켓 인증 주소가 아니면 세션을 변경하지 않는다', async () => {
    const handled = await handleAuthCallback('https://example.com/callback');

    expect(handled).toBe(false);
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('카카오가 로그인 오류를 보내면 해당 이유로 실패한다', async () => {
    await expect(
      handleAuthCallback(
        'com.jieun.sticket://auth/callback?error=access_denied&error_description=사용자가+로그인을+취소했습니다',
      ),
    ).rejects.toThrow('사용자가 로그인을 취소했습니다');
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
});

describe('Google 로그인 프로필', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Google 표시 이름을 신규 프로필의 닉네임 후보로 저장한다', async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
      type: 'success',
      data: {
        idToken: 'google-id-token',
        serverAuthCode: null,
        scopes: ['email', 'profile'],
        user: {
          id: 'google-user-id',
          name: '구글 유저',
          email: 'user@example.com',
          photo: null,
          familyName: '유저',
          givenName: '구글',
        },
      },
    });
    (isSuccessResponse as unknown as jest.Mock).mockReturnValue(true);
    (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
      data: { user: { id: 'supabase-user-id' }, session: {} },
      error: null,
    });
    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'supabase-user-id' } },
      error: null,
    });

    await signInWithGoogle();

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: '구글 유저' },
    });
  });
});
