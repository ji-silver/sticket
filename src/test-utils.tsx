import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

const customRender = async (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const testQueryClient = createTestQueryClient();

  return await render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>,
    options,
  );
};

export * from '@testing-library/react-native';
export { customRender as render };
