import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { act, render, waitFor } from '@testing-library/react-native';
import { AppState, Linking, type AppStateStatus } from 'react-native';

import { supabase } from '../../lib/supabase.ts';
import { getProfile } from '../profile/profile.service.ts';
import { AuthProvider } from './AuthProvider.tsx';
import { handleAuthCallback } from './auth.service.ts';

jest.mock('../../lib/supabase.ts', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}));

jest.mock('../profile/profile.service.ts', () => ({
  getProfile: jest.fn(),
}));

jest.mock('./account.service.ts', () => ({
  deleteCurrentAccount: jest.fn(),
}));

jest.mock('./auth.service.ts', () => ({
  handleAuthCallback: jest.fn(),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const createSession = (userId: string) => ({ user: { id: userId } } as Session);

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('앱이 종료된 상태에서 카카오 로그인이 끝나면 초기 링크의 인증 코드를 처리한다', async () => {
  const callbackUrl =
    'com.jieun.sticket://auth/callback?code=kakao-auth-code';

  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(callbackUrl);
  jest.spyOn(Linking, 'addEventListener').mockReturnValue({
    remove: jest.fn(),
  } as unknown as ReturnType<typeof Linking.addEventListener>);
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: null },
    error: null,
  });
  (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  (handleAuthCallback as jest.Mock).mockResolvedValue(true);

  await act(async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>{null}</AuthProvider>
      </QueryClientProvider>,
    );
  });

  await waitFor(() =>
    expect(handleAuthCallback).toHaveBeenCalledWith(callbackUrl),
  );
});

test('앱이 열려 있을 때 카카오 로그인이 끝나면 새 링크의 인증 코드를 처리한다', async () => {
  const callbackUrl =
    'com.jieun.sticket://auth/callback?code=kakao-auth-code';
  let emitUrl: ((event: { url: string }) => void) | undefined;

  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  jest.spyOn(Linking, 'addEventListener').mockImplementation(
    (_type, listener) => {
      emitUrl = listener;
      return {
        remove: jest.fn(),
      } as unknown as ReturnType<typeof Linking.addEventListener>;
    },
  );
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: null },
    error: null,
  });
  (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  (handleAuthCallback as jest.Mock).mockResolvedValue(true);

  await act(async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>{null}</AuthProvider>
      </QueryClientProvider>,
    );
  });

  await act(async () => {
    emitUrl?.({ url: callbackUrl });
    emitUrl?.({ url: callbackUrl });
  });

  expect(handleAuthCallback).toHaveBeenCalledTimes(1);
  expect(handleAuthCallback).toHaveBeenCalledWith(callbackUrl);
});

test('로그인 사용자가 바뀌면 이전 사용자의 쿼리 캐시를 제거한다', async () => {
  const queryClient = new QueryClient();
  const firstSession = createSession('user-a');
  const secondSession = createSession('user-b');
  let emitAuthChange:
    | ((event: AuthChangeEvent, session: Session | null) => void)
    | undefined;

  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: firstSession },
    error: null,
  });
  (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
    callback => {
      emitAuthChange = callback;

      return { data: { subscription: { unsubscribe: jest.fn() } } };
    },
  );
  (getProfile as jest.Mock).mockResolvedValue(null);

  await act(async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{null}</AuthProvider>
      </QueryClientProvider>,
    );
  });

  await waitFor(() => expect(getProfile).toHaveBeenCalledWith('user-a'));
  queryClient.setQueryData(['tickets'], [{ id: 'ticket-a' }]);

  await act(async () => emitAuthChange?.('SIGNED_IN', secondSession));

  await waitFor(() =>
    expect(queryClient.getQueryData(['tickets'])).toBeUndefined(),
  );
});

test('앱 상태가 바뀌면 서버 데이터의 포커스 상태를 갱신한다', async () => {
  let emitAppStateChange: ((status: AppStateStatus) => void) | undefined;
  const setFocused = jest.spyOn(focusManager, 'setFocused');

  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, listener) => {
      emitAppStateChange = listener;

      return { remove: jest.fn() };
    });
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: null },
    error: null,
  });
  (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });

  await act(async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>{null}</AuthProvider>
      </QueryClientProvider>,
    );
  });

  await act(async () => emitAppStateChange?.('background'));
  expect(setFocused).toHaveBeenLastCalledWith(false);

  await act(async () => emitAppStateChange?.('active'));
  expect(setFocused).toHaveBeenLastCalledWith(true);
});
