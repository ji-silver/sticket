import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';

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

function isAppleSignInCanceled(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === appleAuth.Error.CANCELED
  );
}

export async function signInWithApple() {
  try {
    const credential = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL],
    });

    if (!credential.identityToken) {
      throw new Error('Apple 로그인에서 ID Token을 받지 못했습니다.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: credential.nonce,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    if (isAppleSignInCanceled(error)) {
      return null;
    }

    throw error;
  }
}
