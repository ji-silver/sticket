jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn(() => '1.5.0'),
}));

import React, { useState } from 'react';
import {
  Alert,
  Linking,
  AppState,
  Platform,
  TextInput,
  type AppStateStatus,
} from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {
  act,
  cleanup,
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import AppText from '../../components/common/AppText';
import { supabase } from '../../lib/supabase';
import { publicConfig } from '../../config/publicConfig';
import AppUpdateGate from './AppUpdateGate';

const row = {
  platform: 'ios',
  enabled: true,
  minimum_version: '1.6.0',
  message: '스티켓을 계속 이용하려면 최신 버전으로 업데이트해 주세요.',
};
const maybeSingle = jest.fn();
const builder = {
  select: jest.fn(),
  eq: jest.fn(),
  abortSignal: jest.fn(),
  maybeSingle,
};
let client: QueryClient;
let alert: jest.SpyInstance;

async function expectUpdateAlert() {
  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith(
      '업데이트',
      row.message,
      [{ text: '업데이트하기', onPress: expect.any(Function) }],
      { cancelable: false },
    ),
  );
}

async function pressUpdate() {
  const args = alert.mock.calls.filter(call => call[0] === '업데이트').at(-1);
  await act(async () => args?.[2][0].onPress());
}
const listeners = new Set<(state: AppStateStatus) => void>();

async function openApp(children = <AppText>로그인 화면</AppText>) {
  return render(
    <QueryClientProvider client={client}>
      <AppUpdateGate>{children}</AppUpdateGate>
    </QueryClientProvider>,
  );
}

async function returnToApp() {
  await act(async () => {
    jest.replaceProperty(AppState, 'currentState', 'background');
    listeners.forEach(listener => listener('background'));
    jest.replaceProperty(AppState, 'currentState', 'active');
    listeners.forEach(listener => listener('active'));
  });
}

function MemoEditor() {
  const [memo, setMemo] = useState('');
  return (
    <TextInput accessibilityLabel="메모" value={memo} onChangeText={setMemo} />
  );
}

const originalState = Object.getOwnPropertyDescriptor(
  AppState,
  'currentState',
)!;
beforeAll(() =>
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    writable: true,
    value: 'active',
  }),
);
afterAll(() => Object.defineProperty(AppState, 'currentState', originalState));

describe('앱 시작 시 필수 업데이트', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    jest.replaceProperty(AppState, 'currentState', 'active');
    await AsyncStorage.clear();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    jest.replaceProperty(Platform, 'OS', 'ios');
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.5.0');
    listeners.clear();
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, listener) => {
        listeners.add(listener);
        return { remove: () => listeners.delete(listener) };
      });
    (supabase.from as jest.Mock).mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.abortSignal.mockReturnValue(builder);
    maybeSingle.mockResolvedValue({ data: row, error: null });
  });

  afterEach(async () => {
    await cleanup();
    client.clear();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('첫 정책 확인이 끝나기 전에는 앱 본문에 진입하지 않는다', async () => {
    let finish!: (value: unknown) => void;
    maybeSingle.mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve;
      }),
    );
    await openApp();
    expect(screen.queryByText('앱을 준비하고 있어요')).toBeNull();
    expect(screen.queryByText('로그인 화면')).toBeNull();
    await act(async () =>
      finish({ data: { ...row, enabled: false }, error: null }),
    );
    expect(await screen.findByText('로그인 화면')).toBeOnTheScreen();
  });

  it('로그인 전에도 기준보다 오래된 버전은 업데이트해야 진입할 수 있다', async () => {
    await openApp();
    await expectUpdateAlert();
    expect(screen.queryByText('로그인 화면')).toBeNull();
    expect(screen.queryByText('업데이트')).toBeNull();
  });

  it.each(['1.6.0', '1.7.0'])(
    '설치 버전 %s는 업데이트 없이 앱을 이용한다',
    async version => {
      (DeviceInfo.getVersion as jest.Mock).mockReturnValue(version);
      await openApp();
      expect(await screen.findByText('로그인 화면')).toBeOnTheScreen();
      expect(alert).not.toHaveBeenCalled();
    },
  );

  it('필수 설정이 꺼져 있으면 오래된 버전도 이용한다', async () => {
    maybeSingle.mockResolvedValue({
      data: { ...row, enabled: false },
      error: null,
    });
    await openApp();
    expect(await screen.findByText('로그인 화면')).toBeOnTheScreen();
  });

  it('Android에서는 iOS 정책을 조회하거나 적용하지 않는다', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    await openApp();
    expect(screen.getByText('로그인 화면')).toBeOnTheScreen();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('서버 연결이 실패해도 이미 저장된 필수 설정을 유지한다', async () => {
    await AsyncStorage.setItem(
      `app-update-policy:${publicConfig.supabaseUrl}:ios`,
      JSON.stringify(row),
    );
    maybeSingle.mockResolvedValue({
      data: null,
      error: new Error('연결 실패'),
    });
    await openApp();
    await expectUpdateAlert();
    expect(screen.queryByText('로그인 화면')).toBeNull();
  });

  it('캐시 없이 처음부터 서버에 연결할 수 없으면 앱을 이용할 수 있다', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: new Error('연결 실패'),
    });
    await openApp();
    expect(await screen.findByText('로그인 화면')).toBeOnTheScreen();
  });

  it.each(['저장 실패', '읽기 실패', '오래된 캐시'])(
    '저장소 %s와 재조회 오류가 겹쳐도 이미 확인한 차단을 유지한다',
    async failure => {
      jest.useFakeTimers();
      if (failure === '오래된 캐시') {
        await AsyncStorage.setItem(
          `app-update-policy:${publicConfig.supabaseUrl}:ios`,
          JSON.stringify({ ...row, enabled: false }),
        );
      }
      if (failure !== '읽기 실패') {
        jest
          .spyOn(AsyncStorage, 'setItem')
          .mockRejectedValueOnce(new Error('저장 실패'));
      }
      await openApp();
      await expectUpdateAlert();
      if (failure === '읽기 실패') {
        jest
          .spyOn(AsyncStorage, 'getItem')
          .mockRejectedValueOnce(new Error('읽기 실패'));
      }
      maybeSingle.mockResolvedValue({
        data: null,
        error: new Error('연결 실패'),
      });
      await returnToApp();
      await waitFor(() => expect(client.isFetching()).toBe(0));
      await act(async () => jest.advanceTimersByTimeAsync(100));
      expect(alert).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('로그인 화면')).toBeNull();
    },
  );

  it('스토어에서 돌아와도 구버전이고 정책이 유효하면 차단을 유지한다', async () => {
    await openApp();
    await expectUpdateAlert();
    await pressUpdate();
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://apps.apple.com/app/id6800050133',
    );
    await returnToApp();
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('로그인 화면')).toBeNull();
  });

  it('개발자가 필수 설정을 해제하면 다음 확인에서 진입을 허용한다', async () => {
    await openApp();
    await expectUpdateAlert();
    maybeSingle.mockResolvedValue({
      data: { ...row, enabled: false },
      error: null,
    });
    await returnToApp();
    expect(await screen.findByText('로그인 화면')).toBeOnTheScreen();
  });

  it('인증 과정에서 Query 캐시를 지워도 확인된 필수 안내가 풀리지 않는다', async () => {
    await openApp();
    await expectUpdateAlert();
    maybeSingle.mockReturnValue(new Promise(() => {}));
    await act(async () => client.clear());
    expect(alert).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('로그인 화면')).toBeNull();
  });

  it('복귀 때 정책을 다시 확인해도 작성하던 내용은 초기화하지 않는다', async () => {
    maybeSingle.mockResolvedValue({
      data: { ...row, enabled: false },
      error: null,
    });
    await openApp(<MemoEditor />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('메모'), '직관 기록');
    maybeSingle.mockResolvedValue({ data: row, error: null });
    await returnToApp();
    await expectUpdateAlert();
    expect(screen.queryByLabelText('메모')).toBeNull();
    maybeSingle.mockResolvedValue({
      data: { ...row, enabled: false },
      error: null,
    });
    await returnToApp();
    expect(await screen.findByDisplayValue('직관 기록')).toBeOnTheScreen();
  });

  it('스토어 이동 실패를 알리고 확인을 누르면 필수 알림을 다시 표시한다', async () => {
    (Linking.openURL as jest.Mock).mockRejectedValueOnce(
      new Error('이동 실패'),
    );
    await openApp();
    await expectUpdateAlert();
    await pressUpdate();
    expect(alert).toHaveBeenLastCalledWith(
      'App Store를 열지 못했어요',
      '잠시 후 다시 시도해 주세요.',
      [{ text: '확인', onPress: expect.any(Function) }],
      { cancelable: false },
    );
    await act(async () => alert.mock.calls.at(-1)?.[2][0].onPress());
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(3));
    expect(screen.queryByText('로그인 화면')).toBeNull();
  });

  it('알림의 활성 상태 변화나 중복 재조회로 알림을 겹쳐 띄우지 않는다', async () => {
    await openApp();
    await expectUpdateAlert();
    await act(async () => {
      listeners.forEach(listener => listener('inactive'));
      listeners.forEach(listener => listener('active'));
    });
    await returnToApp();
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(alert).toHaveBeenCalledTimes(1);
  });

  it('시작 시 아직 inactive여도 active가 되면 기본 알림을 표시한다', async () => {
    jest.replaceProperty(AppState, 'currentState', 'inactive');
    await openApp();
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(alert).not.toHaveBeenCalled();
    await act(async () => {
      jest.replaceProperty(AppState, 'currentState', 'active');
      listeners.forEach(listener => listener('active'));
    });
    await expectUpdateAlert();
  });

  it('확인된 필수 정책은 복귀 재조회가 느려도 바로 알린다', async () => {
    await openApp();
    await expectUpdateAlert();
    await pressUpdate();
    maybeSingle.mockReturnValue(new Promise(() => {}));
    await returnToApp();
    expect(client.isFetching()).toBe(1);
    expect(alert).toHaveBeenCalledTimes(2);
    expect(listeners.size).toBe(1);
  });
});
