import { createClient, type User } from '@supabase/supabase-js';
import { decodeJwt, importPKCS8, SignJWT } from 'jose';

interface DeleteAccountRequest {
  appleAuthorizationCode?: unknown;
  appleIdentityToken?: unknown;
}

interface AppleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

const TICKET_BOOK_COVER_BUCKET = 'ticket-book-covers';

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getRequiredEnvironmentVariable(name: string) {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`${name} 환경 변수가 설정되지 않았습니다.`);
  }

  return value;
}

function getAppleIdentitySubject(user: User) {
  const identity = user.identities?.find(item => item.provider === 'apple');

  if (!identity) {
    return null;
  }

  const subject = identity.identity_data?.sub;
  return typeof subject === 'string' ? subject : identity.identity_id;
}

async function createAppleClientSecret() {
  const teamId = getRequiredEnvironmentVariable('APPLE_TEAM_ID');
  const keyId = getRequiredEnvironmentVariable('APPLE_KEY_ID');
  const clientId = getRequiredEnvironmentVariable('APPLE_CLIENT_ID');
  const privateKeyText = getRequiredEnvironmentVariable(
    'APPLE_PRIVATE_KEY',
  ).replace(/\\n/g, '\n');
  const privateKey = await importPKCS8(privateKeyText, 'ES256');

  return new SignJWT({})
    .setProtectedHeader({
      alg: 'ES256',
      kid: keyId,
    })
    .setIssuer(teamId)
    .setAudience('https://appleid.apple.com')
    .setSubject(clientId)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
}

async function exchangeAppleAuthorizationCode(authorizationCode: string) {
  const clientId = getRequiredEnvironmentVariable('APPLE_CLIENT_ID');
  const clientSecret = await createAppleClientSecret();
  const response = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: 'authorization_code',
    }),
  });
  const body = (await response.json()) as AppleTokenResponse;

  if (!response.ok) {
    console.error('Apple authorization code exchange failed.', {
      error: body.error,
      description: body.error_description,
      status: response.status,
    });

    if (body.error === 'invalid_grant') {
      throw new Error(
        'Apple 인증 코드가 이미 사용되었거나 만료되었습니다. 다시 시도해 주세요.',
      );
    }

    if (body.error === 'invalid_client') {
      throw new Error('Apple 로그인 서버 설정이 올바르지 않습니다.');
    }

    throw new Error('Apple 계정 확인에 실패했습니다.');
  }

  return body;
}

async function revokeAppleAuthorization(
  user: User,
  authorizationCode: string,
  identityToken: string,
) {
  const expectedSubject = getAppleIdentitySubject(user);
  const identityClaims = decodeJwt(identityToken);
  const clientId = getRequiredEnvironmentVariable('APPLE_CLIENT_ID');
  const identityTokenAudiences = Array.isArray(identityClaims.aud)
    ? identityClaims.aud
    : [identityClaims.aud];

  if (!identityTokenAudiences.includes(clientId)) {
    throw new Error(
      'Apple 인증 정보의 앱 식별자가 현재 앱과 일치하지 않습니다.',
    );
  }

  if (expectedSubject && identityClaims.sub !== expectedSubject) {
    throw new Error('가입할 때 사용한 Apple 계정으로 다시 인증해 주세요.');
  }

  const tokenResponse = await exchangeAppleAuthorizationCode(
    authorizationCode.trim(),
  );
  const tokenSubject = tokenResponse.id_token
    ? decodeJwt(tokenResponse.id_token).sub
    : null;

  if (expectedSubject && tokenSubject !== expectedSubject) {
    throw new Error('가입할 때 사용한 Apple 계정으로 다시 인증해 주세요.');
  }

  const token = tokenResponse.refresh_token ?? tokenResponse.access_token;

  if (!token) {
    throw new Error('Apple 연결 해제 정보를 받지 못했습니다.');
  }

  const clientSecret = await createAppleClientSecret();
  const tokenType = tokenResponse.refresh_token
    ? 'refresh_token'
    : 'access_token';
  const response = await fetch('https://appleid.apple.com/auth/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token,
      token_type_hint: tokenType,
    }),
  });

  if (!response.ok) {
    console.error('Apple token revocation failed.', response.status);
    throw new Error('Apple 계정 연결을 해제하지 못했습니다.');
  }
}

async function getTicketBookCoverPaths(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
) {
  const bucket = adminClient.storage.from(TICKET_BOOK_COVER_BUCKET);
  const { data: rootItems, error: rootError } = await bucket.list(userId, {
    limit: 1000,
  });

  if (rootError) {
    throw rootError;
  }

  const paths: string[] = [];

  for (const item of rootItems) {
    const itemPath = `${userId}/${item.name}`;

    if (item.id) {
      paths.push(itemPath);
      continue;
    }

    const { data: nestedItems, error: nestedError } = await bucket.list(
      itemPath,
      { limit: 1000 },
    );

    if (nestedError) {
      throw nestedError;
    }

    nestedItems.forEach(nestedItem => {
      if (nestedItem.id) {
        paths.push(`${itemPath}/${nestedItem.name}`);
      }
    });
  }

  return paths;
}

Deno.serve(async request => {
  if (request.method !== 'POST') {
    return jsonResponse({ message: '지원하지 않는 요청입니다.' }, 405);
  }

  const authorizationHeader = request.headers.get('Authorization');

  if (!authorizationHeader) {
    return jsonResponse({ message: '로그인이 필요합니다.' }, 401);
  }

  try {
    const supabaseUrl = getRequiredEnvironmentVariable('SUPABASE_URL');
    const anonKey = getRequiredEnvironmentVariable('SUPABASE_ANON_KEY');
    const serviceRoleKey = getRequiredEnvironmentVariable(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authorizationHeader,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        { message: '로그인 정보를 확인할 수 없습니다.' },
        401,
      );
    }

    let requestBody: DeleteAccountRequest = {};

    try {
      requestBody = (await request.json()) as DeleteAccountRequest;
    } catch {
      // 요청 본문이 비어 있어도 Apple 사용자가 아니면 탈퇴할 수 있습니다.
    }

    const hasAppleIdentity = user.identities?.some(
      identity => identity.provider === 'apple',
    );

    if (hasAppleIdentity) {
      if (
        typeof requestBody.appleAuthorizationCode !== 'string' ||
        typeof requestBody.appleIdentityToken !== 'string'
      ) {
        return jsonResponse(
          { message: 'Apple 계정을 다시 확인해 주세요.' },
          400,
        );
      }

      await revokeAppleAuthorization(
        user,
        requestBody.appleAuthorizationCode,
        requestBody.appleIdentityToken,
      );
    }

    const coverPaths = await getTicketBookCoverPaths(adminClient, user.id);

    if (coverPaths.length > 0) {
      const { error: storageError } = await adminClient.storage
        .from(TICKET_BOOK_COVER_BUCKET)
        .remove(coverPaths);

      if (storageError) {
        throw storageError;
      }
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
      user.id,
    );

    if (deleteUserError) {
      throw deleteUserError;
    }

    return jsonResponse({ deleted: true }, 200);
  } catch (error) {
    console.error('Account deletion failed.', error);

    return jsonResponse(
      {
        message:
          error instanceof Error
            ? error.message
            : '계정을 삭제하지 못했습니다.',
      },
      500,
    );
  }
});
