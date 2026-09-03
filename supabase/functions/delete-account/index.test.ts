const mockCreateClient = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

jest.mock('jose', () => ({
  decodeJwt: jest.fn(),
  importPKCS8: jest.fn(),
  SignJWT: jest.fn(),
}));

type DeleteAccountHandler = (request: Request) => Promise<Response>;

let deleteAccountHandler: DeleteAccountHandler;
let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  Object.assign(globalThis, {
    Deno: {
      env: {
        get: (name: string) => `test-${name.toLowerCase()}`,
      },
      serve: (handler: DeleteAccountHandler) => {
        deleteAccountHandler = handler;
      },
    },
  });

  require('./index');
});

beforeEach(() => {
  mockCreateClient.mockReset();
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

function arrangeDeletion({
  deleteUserError = null,
  storageRemoveError = null,
}: {
  deleteUserError?: Error | null;
  storageRemoveError?: Error | null;
}) {
  const remove = jest.fn().mockResolvedValue({ error: storageRemoveError });
  const list = jest.fn().mockResolvedValue({
    data: [{ id: 'file-id', name: 'photo.jpg' }],
    error: null,
  });
  const deleteUser = jest.fn().mockResolvedValue({ error: deleteUserError });
  const userClient = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-id',
            identities: [{ provider: 'google' }],
          },
        },
        error: null,
      }),
    },
  };
  const adminClient = {
    auth: { admin: { deleteUser } },
    storage: {
      from: jest.fn(() => ({ list, remove })),
    },
  };

  mockCreateClient
    .mockReturnValueOnce(userClient)
    .mockReturnValueOnce(adminClient);

  return { deleteUser, remove };
}

function createDeleteRequest() {
  return new Request('https://example.com/delete-account', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
}

test('계정 삭제가 실패하면 storage 파일을 삭제하지 않는다', async () => {
  const { remove } = arrangeDeletion({
    deleteUserError: new Error('사용자 삭제 실패'),
  });

  const response = await deleteAccountHandler(createDeleteRequest());

  expect(response.status).toBe(500);
  expect(remove).not.toHaveBeenCalled();
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    '회원 탈퇴에 실패했습니다.',
    expect.any(Error),
  );
});

test('계정 삭제 후 storage 정리가 실패해도 탈퇴 성공으로 응답한다', async () => {
  const { deleteUser } = arrangeDeletion({
    storageRemoveError: new Error('스토리지 정리 실패'),
  });

  const response = await deleteAccountHandler(createDeleteRequest());

  await expect(response.json()).resolves.toEqual({ deleted: true });
  expect(response.status).toBe(200);
  expect(deleteUser).toHaveBeenCalledWith('user-id');
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    '회원 탈퇴 후 스토리지 정리에 실패했습니다.',
    expect.objectContaining({ userId: 'user-id' }),
  );
});
