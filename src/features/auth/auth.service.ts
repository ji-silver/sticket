import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

import { publicConfig } from '../../config/publicConfig';
import { supabase } from '../../lib/supabase';

GoogleSignin.configure({
  webClientId: publicConfig.googleWebClientId,
  iosClientId: publicConfig.googleIosClientId,
  offlineAccess: false,
});

export async function signInWithGoogle() {
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    return null;
  }

  const idToken = response.data.idToken;

  if (!idToken) {
    throw new Error('Google 로그인에서 ID Token을 받지 못했습니다.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    throw error;
  }

  return data;
}
