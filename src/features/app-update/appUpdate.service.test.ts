jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn() } }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { publicConfig } from '../../config/publicConfig';
import { getAppUpdatePolicy } from './appUpdate.service';

async function readPolicy(platform: 'ios', signal?: AbortSignal) {
  return (await getAppUpdatePolicy(platform, signal)).policy;
}

const row = {
  platform: 'ios',
  enabled: true,
  minimum_version: '1.6.0',
  message: '최신 버전으로 업데이트해 주세요.',
};
const key = `app-update-policy:${publicConfig.supabaseUrl}:ios`;
const maybeSingle = jest.fn();
const builder = {
  select: jest.fn(),
  eq: jest.fn(),
  abortSignal: jest.fn(),
  maybeSingle,
};

describe('필수 업데이트 정책 조회와 저장', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    (supabase.from as jest.Mock).mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.abortSignal.mockReturnValue(builder);
    maybeSingle.mockResolvedValue({ data: row, error: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('플랫폼 정책을 조회하고 다음 실행을 위해 저장한다', async () => {
    expect(await readPolicy('ios')).toEqual({
      platform: 'ios',
      enabled: true,
      minimumVersion: '1.6.0',
      message: row.message,
    });
    expect(builder.eq).toHaveBeenCalledWith('platform', 'ios');
    expect(JSON.parse((await AsyncStorage.getItem(key))!)).toEqual(row);
  });

  it.each([
    { data: null, error: new Error('연결 실패') },
    { data: { ...row, minimum_version: 'bad' }, error: null },
    { data: { ...row, platform: 'android' }, error: null },
  ])(
    '조회 실패나 잘못된 응답에도 이전에 확인한 차단을 유지한다',
    async response => {
      await AsyncStorage.setItem(key, JSON.stringify(row));
      maybeSingle.mockResolvedValue(response);
      expect((await readPolicy('ios'))?.enabled).toBe(true);
      expect((await readPolicy('ios'))?.minimumVersion).toBe('1.6.0');
      expect(JSON.parse((await AsyncStorage.getItem(key))!)).toEqual(row);
    },
  );

  it('정책 삭제가 정상 확인되면 이전 차단을 해제한다', async () => {
    await AsyncStorage.setItem(key, JSON.stringify(row));
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await readPolicy('ios')).toBeNull();
    expect(await AsyncStorage.getItem(key)).toBeNull();
  });

  it('비활성화된 정책으로 기존 필수 설정을 교체한다', async () => {
    await AsyncStorage.setItem(key, JSON.stringify(row));
    maybeSingle.mockResolvedValue({
      data: { ...row, enabled: false },
      error: null,
    });
    expect((await readPolicy('ios'))?.enabled).toBe(false);
    expect(JSON.parse((await AsyncStorage.getItem(key))!).enabled).toBe(false);
  });

  it('처음부터 연결할 수 없거나 캐시가 손상된 경우 이용을 허용한다', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: new Error('연결 실패'),
    });
    expect(await readPolicy('ios')).toBeNull();
    await AsyncStorage.setItem(key, '{broken');
    expect(await readPolicy('ios')).toBeNull();
  });

  it('다른 서버 환경의 저장된 정책은 사용하지 않는다', async () => {
    await AsyncStorage.setItem(
      'app-update-policy:https://other.supabase.co:ios',
      JSON.stringify(row),
    );
    maybeSingle.mockResolvedValue({
      data: null,
      error: new Error('연결 실패'),
    });
    expect(await readPolicy('ios')).toBeNull();
  });

  it('캐시 저장이 실패해도 서버에서 확인한 필수 정책을 적용한다', async () => {
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('저장 실패'));
    expect((await readPolicy('ios'))?.enabled).toBe(true);
  });

  it('5초가 지나도 서버가 응답하지 않으면 저장된 정책으로 판단한다', async () => {
    jest.useFakeTimers();
    await AsyncStorage.setItem(key, JSON.stringify(row));
    maybeSingle.mockReturnValue(new Promise(() => {}));
    const request = readPolicy('ios');
    await jest.advanceTimersByTimeAsync(5000);
    expect((await request)?.enabled).toBe(true);
    expect(builder.abortSignal.mock.calls[0][0].aborted).toBe(true);
  });

  it('취소된 요청의 늦은 응답이 저장된 정책을 바꾸지 않는다', async () => {
    await AsyncStorage.setItem(key, JSON.stringify(row));
    let finish!: (value: unknown) => void;
    maybeSingle.mockReturnValue(
      new Promise(resolve => {
        finish = resolve;
      }),
    );
    const controller = new AbortController();
    const request = readPolicy('ios', controller.signal);
    const rejection = request.catch(error => error);
    controller.abort();
    expect(await rejection).toBeInstanceOf(Error);
    finish({ data: { ...row, enabled: false }, error: null });
    expect(JSON.parse((await AsyncStorage.getItem(key))!).enabled).toBe(true);
  });

  it('기기 저장이 끝나지 않아도 서버에서 확인한 정책을 바로 반환한다', async () => {
    jest.useFakeTimers();
    let finishStorage!: () => void;
    jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishStorage = resolve;
        }),
    );
    let policyReceived = false;
    const request = readPolicy('ios').then(policy => {
      policyReceived = policy?.enabled === true;
    });
    await jest.advanceTimersByTimeAsync(0);
    const receivedBeforeStorage = policyReceived;
    finishStorage();
    await request;
    expect(receivedBeforeStorage).toBe(true);
  });
});
