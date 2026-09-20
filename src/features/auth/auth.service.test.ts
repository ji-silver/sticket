가import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

import { supabase } from '../../lib/supabase';
import { signInWithGoogle } from './auth.service';

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
      signInWithIdToken: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

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
