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

const STORAGE_BUCKETS = [
  'ticket-book-covers',
  'ticket-originals',
  'ticket-diaries',
] as const;
const STORAGE_BATCH_SIZE = 1000;

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
    console.error('Apple 인증 코드 교환에 실패했습니다.', {
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
    console.error('Apple 계정 연결 해제에 실패했습니다.', response.status);
    throw new Error('Apple 계정 연결을 해제하지 못했습니다.');
  }
}

async function getStorageFilePaths(
  adminClient: ReturnType<typeof createClient>,
  bucketName: (typeof STORAGE_BUCKETS)[number],
  userId: string,
) {
  const bucket = adminClient.storage.from(bucketName);

  async function listFolder(folderPath: string): Promise<string[]> {
    const paths: string[] = [];

    for (let offset = 0; ; offset += STORAGE_BATCH_SIZE) {
      const { data: items, error } = await bucket.list(folderPath, {
        limit: STORAGE_BATCH_SIZE,
        offset,
      });

      if (error) {
        throw error;
      }

      for (const item of items) {
        const itemPath = `${folderPath}/${item.name}`;

        if (item.id) {
          paths.push(itemPath);
        } else {
          paths.push(...(await listFolder(itemPath)));
        }
      }

      if (items.length < STORAGE_BATCH_SIZE) {
        break;
      }
    }

    return paths;
  }

  return listFolder(userId);
}

async function removeStorageFiles(
  adminClient: ReturnType<typeof createClient>,
  bucketName: (typeof STORAGE_BUCKETS)[number],
  paths: string[],
) {
  const bucket = adminClient.storage.from(bucketName);

  for (let index = 0; index < paths.length; index += STORAGE_BATCH_SIZE) {
    const { error } = await bucket.remove(
      paths.slice(index, index + STORAGE_BATCH_SIZE),
    );

    if (error) {
      throw error;
    }
  }
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

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
      user.id,
    );

    if (deleteUserError) {
      throw deleteUserError;
    }

    try {
      for (const bucketName of STORAGE_BUCKETS) {
        const filePaths = await getStorageFilePaths(
          adminClient,
          bucketName,
          user.id,
        );

        if (filePaths.length > 0) {
          await removeStorageFiles(adminClient, bucketName, filePaths);
        }
      }
    } catch (storageCleanupError) {
      console.error('회원 탈퇴 후 스토리지 정리에 실패했습니다.', {
        userId: user.id,
        error: storageCleanupError,
      });
    }

    return jsonResponse({ deleted: true }, 200);
  } catch (error) {
    console.error('회원 탈퇴에 실패했습니다.', error);

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
