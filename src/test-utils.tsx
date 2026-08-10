import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { notifyManager } from '@tanstack/react-query';

// React Query의 비동기 업데이트를 동기로 전환하여
// cascading query(쿼리 A 결과 → 쿼리 B 활성화) 같은
// 연쇄 의존 패턴에서 타이밍 이슈가 발생하지 않도록 합니다.
notifyManager.setNotifyFunction(fn => fn());

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      mutations: {
        gcTime: Infinity,
      },
      queries: {
        gcTime: Infinity,
        retry: false,
      },
    },
  });

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const testQueryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>,
    options
  );
};

export * from '@testing-library/react-native';
export { customRender as render };
