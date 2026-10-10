import { useEffect, useState, type PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { requiresAppUpdate, type AppUpdatePolicy } from './appUpdate';
import { useAppUpdatePolicy } from './api/useAppUpdatePolicy';
import { useRequiredUpdateAlert } from './useRequiredUpdateAlert';
import AppLoadingScreen from '../../components/common/AppLoadingScreen';

export default function AppUpdateGate({ children }: PropsWithChildren) {
  const query = useAppUpdatePolicy();
  const [confirmedPolicy, setConfirmedPolicy] = useState<
    AppUpdatePolicy | null | undefined
  >();
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const isIos = Platform.OS === 'ios';
  // 인증 상태 변경 때 전체 Query 캐시가 비워져도 이미 확인한 차단은 유지한다.
  // 저장 실패 후 오래된 디스크 캐시가 반환되어도 이번 실행에서 확인한 서버 정책을 덮지 않는다.
  const policy =
    query.data &&
    (query.data.source === 'server' || confirmedPolicy === undefined)
      ? query.data.policy
      : confirmedPolicy;
  const isBlocked =
    isIos && requiresAppUpdate(DeviceInfo.getVersion(), policy ?? null);
  const isReady = !isIos || policy !== undefined || query.isError;
  const canShowApp = hasEnteredApp || (isReady && !isBlocked);
  useRequiredUpdateAlert(isBlocked, policy?.message ?? '', query.refetch);

  useEffect(() => {
    if (
      query.data &&
      (query.data.source === 'server' || confirmedPolicy === undefined)
    ) {
      setConfirmedPolicy(query.data.policy);
    }
  }, [query.data, confirmedPolicy]);

  useEffect(() => {
    if (isReady && !isBlocked) setHasEnteredApp(true);
  }, [isReady, isBlocked]);

  return (
    <View
      style={styles.root}
      pointerEvents={isBlocked ? 'none' : 'auto'}
      accessibilityElementsHidden={isBlocked}
      importantForAccessibility={isBlocked ? 'no-hide-descendants' : 'auto'}
    >
      {canShowApp ? children : <AppLoadingScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
