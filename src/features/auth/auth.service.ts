import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { Linking } from 'react-native';

import { publicConfig } from '../../config/publicConfig';
import { supabase } from '../../lib/supabase';

const AUTH_CALLBACK_URL = 'com.jieun.sticket://auth/callback';

export async function signInWithKakao() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: AUTH_CALLBACK_URL,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error('카카오 로그인 주소를 받지 못했습니다.');
  }

  await Linking.openURL(data.url);
  return data;
}

export async function handleAuthCallback(url: string) {
  let callbackUrl: URL;

  try {
    callbackUrl = new URL(url);
  } catch {
    return false;
  }

  if (
    callbackUrl.protocol !== 'com.jieun.sticket:' ||
    callbackUrl.host !== 'auth' ||
    callbackUrl.pathname !== '/callback'
  ) {
    return false;
  }

  const fragment = new URLSearchParams(callbackUrl.hash.slice(1));
  const errorDescription =
    callbackUrl.searchParams.get('error_description') ??
    fragment.get('error_description') ??
    callbackUrl.searchParams.get('error') ??
    fragment.get('error');

  if (errorDescription) {
    throw new Error(errorDescription);
  }

  const code = callbackUrl.searchParams.get('code') ?? fragment.get('code');

  if (!code) {
    return false;
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    throw error;
  }

  return true;
}

export function requestGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: publicConfig.googleWebClientId,
    iosClientId: publicConfig.googleIosClientId,
    offlineAccess: false,
  });

  return GoogleSignin.signIn();
}

export async function signInWithGoogle() {
  const response = await requestGoogleSignIn();

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

  const googleName = response.data.user.name?.trim();

  if (googleName) {
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: googleName },
    });

    if (updateError) {
      throw updateError;
    }
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
