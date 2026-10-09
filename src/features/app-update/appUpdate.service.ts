import AsyncStorage from '@react-native-async-storage/async-storage';
import { publicConfig } from '../../config/publicConfig';
import { supabase } from '../../lib/supabase';
import {
  parseAppUpdatePolicy,
  type AppUpdatePlatform,
  type AppUpdatePolicyResult,
} from './appUpdate';

export async function getAppUpdatePolicy(
  platform: AppUpdatePlatform,
  signal?: AbortSignal,
): Promise<AppUpdatePolicyResult> {
  // 개발 서버의 테스트용 차단 정책이 운영 앱에 적용되지 않도록 환경별로 저장한다.
  const cacheKey = `app-update-policy:${publicConfig.supabaseUrl}:${platform}`;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel: (() => void) | undefined;

  try {
    if (signal?.aborted) throw new Error('업데이트 확인이 취소되었습니다.');

    const interrupted = new Promise<never>((_resolve, reject) => {
      cancel = () => {
        controller.abort();
        reject(new Error('업데이트 확인이 취소되었습니다.'));
      };
      signal?.addEventListener('abort', cancel, { once: true });
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error('업데이트 확인 시간이 초과되었습니다.'));
      }, 5000);
    });

    // auth 잠금이나 네트워크가 응답하지 않아도 시작 화면에서 무한 대기하지 않는다.
    const { data, error } = await Promise.race([
      supabase
        .from('app_update_policies')
        .select('platform, enabled, minimum_version, message')
        .eq('platform', platform)
        .abortSignal(controller.signal)
        .maybeSingle(),
      interrupted,
    ]);
    if (signal?.aborted) throw new Error('업데이트 확인이 취소되었습니다.');
    if (error) throw error;

    const policy = data === null ? null : parseAppUpdatePolicy(data);
    if (policy && policy.platform !== platform) {
      throw new Error('다른 플랫폼의 업데이트 정책입니다.');
    }

    // 저장은 시작하되 완료를 기다리지 않는다. 기기 저장 지연으로 알림까지 늦추지 않는다.
    // 이번 실행의 서버 정책은 gate가 보존하므로 저장 실패가 확인된 차단을 풀지 않는다.
    const cacheWrite =
      data === null
        ? AsyncStorage.removeItem(cacheKey)
        : AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    cacheWrite.catch(() => {});
    return { policy, source: 'server' };
  } catch (error) {
    // 취소된 React Query 요청은 이전 응답으로 화면이나 캐시를 바꾸지 않는다.
    if (signal?.aborted) throw error;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return { policy: null, source: 'cache' };
      const policy = parseAppUpdatePolicy(JSON.parse(cached));
      return {
        policy: policy.platform === platform ? policy : null,
        source: 'cache',
      };
    } catch {
      // 최초 실행에서 연결과 캐시를 모두 사용할 수 없으면 앱 이용을 허용한다.
      return { policy: null, source: 'cache' };
    }
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (cancel) signal?.removeEventListener('abort', cancel);
  }
}
