export type AppUpdatePlatform = 'ios' | 'android';

export type AppUpdatePolicy = {
  platform: AppUpdatePlatform;
  enabled: boolean;
  minimumVersion: string;
  message: string;
};

export type AppUpdatePolicyResult = {
  policy: AppUpdatePolicy | null;
  source: 'server' | 'cache';
};

function parseVersion(version: string): number[] {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('앱 버전 형식이 올바르지 않습니다.');
  }
  const parts = version.split('.').map(Number);
  if (parts.some(part => !Number.isSafeInteger(part))) {
    throw new Error('앱 버전의 숫자가 너무 큽니다.');
  }
  return parts;
}

export function parseAppUpdatePolicy(value: unknown): AppUpdatePolicy {
  if (!value || typeof value !== 'object') {
    throw new Error('업데이트 정책이 올바르지 않습니다.');
  }
  const row = value as Record<string, unknown>;
  if (
    (row.platform !== 'ios' && row.platform !== 'android') ||
    typeof row.enabled !== 'boolean' ||
    typeof row.minimum_version !== 'string' ||
    typeof row.message !== 'string' ||
    !row.message.trim()
  ) {
    throw new Error('업데이트 정책이 올바르지 않습니다.');
  }
  parseVersion(row.minimum_version);
  return {
    platform: row.platform,
    enabled: row.enabled,
    minimumVersion: row.minimum_version,
    message: row.message.trim(),
  };
}

export function requiresAppUpdate(
  version: string,
  policy: AppUpdatePolicy | null,
): boolean {
  if (!policy?.enabled) return false;

  try {
    const installed = parseVersion(version);
    const minimum = parseVersion(policy.minimumVersion);
    // 문자열 비교는 1.10.0을 1.9.0보다 작게 판단하므로 숫자 단위로 비교한다.
    for (let index = 0; index < installed.length; index += 1) {
      if (installed[index] !== minimum[index]) {
        return installed[index] < minimum[index];
      }
    }
  } catch {
    // 네이티브 설치 버전을 읽지 못했을 때 임의로 모든 사용자를 차단하지 않는다.
    return false;
  }
  return false;
}
