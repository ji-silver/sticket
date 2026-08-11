import { appleAuth } from '@invertase/react-native-apple-authentication';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import {
  FunctionsHttpError,
  type Session,
} from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';
import { requestGoogleSignIn } from './auth.service';

type AuthProvider = 'apple' | 'google';

function getProviderIdentity(session: Session, provider: AuthProvider) {
  return session.user.identities?.find(identity => identity.provider === provider);
}

function getProviderUserId(session: Session, provider: AuthProvider) {
  const identity = getProviderIdentity(session, provider);

  if (!identity) {
    return null;
  }

  const subject = identity.identity_data?.sub;
  return typeof subject === 'string' ? subject : identity.identity_id;
}

function getConnectedProviders(session: Session) {
  const providers = new Set<AuthProvider>();

  session.user.identities?.forEach(identity => {
    if (identity.provider === 'apple' || identity.provider === 'google') {
      providers.add(identity.provider);
    }
  });

  if (providers.size === 0) {
    const primaryProvider = session.user.app_metadata.provider;

    if (primaryProvider === 'apple' || primaryProvider === 'google') {
      providers.add(primaryProvider);
    }
  }

  return providers;
}

async function reauthenticateAndRevokeGoogle(session: Session) {
  const response = await requestGoogleSignIn();

  if (!isSuccessResponse(response)) {
    return false;
  }

  const expectedGoogleUserId = getProviderUserId(session, 'google');

  if (
    expectedGoogleUserId &&
    response.data.user.id !== expectedGoogleUserId
  ) {
    throw new Error('가입할 때 사용한 Google 계정으로 다시 인증해 주세요.');
  }

  await GoogleSignin.revokeAccess();
  return true;
}

async function requestAppleDeletionCredential(session: Session) {
  try {
    const expectedAppleUserId = getProviderUserId(session, 'apple');
    const credential = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [],
      user: expectedAppleUserId ?? undefined,
    });

    if (expectedAppleUserId && credential.user !== expectedAppleUserId) {
      throw new Error('가입할 때 사용한 Apple 계정으로 다시 인증해 주세요.');
    }

    if (!credential.authorizationCode) {
      throw new Error('Apple 계정 확인 정보를 받지 못했습니다.');
    }

    if (!credential.identityToken) {
      throw new Error('Apple 계정 식별 정보를 받지 못했습니다.');
    }

    return {
      authorizationCode: credential.authorizationCode,
      identityToken: credential.identityToken,
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === appleAuth.Error.CANCELED
    ) {
      return null;
    }

    throw error;
  }
}

async function getFunctionErrorMessage(error: FunctionsHttpError) {
  try {
    const body = (await error.context.json()) as {
      message?: unknown;
    };

    if (typeof body.message === 'string') {
      return body.message;
    }
  } catch {
    // 응답 본문이 JSON이 아니면 기본 메시지를 사용합니다.
  }

  return '계정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export async function deleteCurrentAccount(session: Session) {
  const providers = getConnectedProviders(session);
  let appleCredential: Awaited<
    ReturnType<typeof requestAppleDeletionCredential>
  > = null;

  if (providers.has('apple')) {
    appleCredential = await requestAppleDeletionCredential(session);

    if (!appleCredential) {
      return false;
    }
  }

  if (providers.has('google')) {
    const didRevokeGoogle = await reauthenticateAndRevokeGoogle(session);

    if (!didRevokeGoogle) {
      return false;
    }
  }

  const { error } = await supabase.functions.invoke('delete-account', {
    body: {
      appleAuthorizationCode: appleCredential?.authorizationCode ?? null,
      appleIdentityToken: appleCredential?.identityToken ?? null,
    },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      throw new Error(await getFunctionErrorMessage(error));
    }

    throw error;
  }

  const { error: signOutError } = await supabase.auth.signOut({
    scope: 'local',
  });

  if (signOutError) {
    throw signOutError;
  }

  return true;
}
