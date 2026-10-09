import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';

export function useRequiredUpdateAlert(
  isBlocked: boolean,
  message: string,
  refetchPolicy: () => Promise<unknown>,
) {
  const [promptVersion, setPromptVersion] = useState(0);
  const isAlertVisible = useRef(false);
  const latestBlocked = useRef(isBlocked);

  useEffect(() => {
    latestBlocked.current = isBlocked;
  }, [isBlocked]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active' && previous !== 'active') {
        refetchPolicy();
        setPromptVersion(value => value + 1);
      }
      previous = next;
    });
    return () => subscription.remove();
  }, [refetchPolicy]);

  useEffect(() => {
    if (
      !isBlocked ||
      isAlertVisible.current ||
      (AppState.currentState !== null && AppState.currentState !== 'active')
    )
      return;

    isAlertVisible.current = true;
    Alert.alert(
      '업데이트',
      message,
      [
        {
          text: '업데이트하기',
          onPress: async () => {
            isAlertVisible.current = false;
            // 표시 중 정책이 해제되었다면 오래된 알림 버튼으로 스토어를 열지 않는다.
            if (!latestBlocked.current) return;
            try {
              await Linking.openURL('https://apps.apple.com/app/id6800050133');
            } catch {
              isAlertVisible.current = true;
              Alert.alert(
                'App Store를 열지 못했어요',
                '잠시 후 다시 시도해 주세요.',
                [
                  {
                    text: '확인',
                    onPress: () => {
                      isAlertVisible.current = false;
                      setPromptVersion(value => value + 1);
                    },
                  },
                ],
                { cancelable: false },
              );
            }
          },
        },
      ],
      { cancelable: false },
    );
  }, [isBlocked, message, promptVersion]);
}
