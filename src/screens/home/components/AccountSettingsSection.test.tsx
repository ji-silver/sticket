import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import AccountSettingsSection from './AccountSettingsSection';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.0.0',
}));

describe('AccountSettingsSection 서비스 정보', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('앱 평가하기를 누르면 스티켓의 App Store 리뷰 작성 화면을 연다', async () => {
    const user = userEvent.setup();
    await render(
      <AccountSettingsSection
        onPressLogout={jest.fn()}
        onPressWithdrawal={jest.fn()}
      />,
    );

    await user.press(screen.getByRole('button', { name: '앱 평가하기' }));

    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://apps.apple.com/app/id6800050133?action=write-review',
    );
  });

  it('리뷰 화면을 열지 못하면 안내하고 설정에서 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('failed'));
    await render(
      <AccountSettingsSection
        onPressLogout={jest.fn()}
        onPressWithdrawal={jest.fn()}
      />,
    );

    await user.press(screen.getByRole('button', { name: '앱 평가하기' }));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'App Store를 열지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    });
    await user.press(screen.getByRole('button', { name: '앱 평가하기' }));
    expect(Linking.openURL).toHaveBeenCalledTimes(2);
  });

  it('문의 및 피드백을 누르면 스티켓 문의 제목으로 메일 앱을 연다', async () => {
    const user = userEvent.setup();
    await render(
      <AccountSettingsSection
        onPressLogout={jest.fn()}
        onPressWithdrawal={jest.fn()}
      />,
    );

    await user.press(screen.getByRole('button', { name: '문의 및 피드백' }));

    expect(Linking.openURL).toHaveBeenCalledWith(
      'mailto:hello.appworks@gmail.com?subject=%5B%EC%8A%A4%ED%8B%B0%EC%BC%93%20%EB%AC%B8%EC%9D%98%5D',
    );
  });

  it('메일 앱을 열 수 없으면 안내한다', async () => {
    const user = userEvent.setup();
    jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('failed'));
    await render(
      <AccountSettingsSection
        onPressLogout={jest.fn()}
        onPressWithdrawal={jest.fn()}
      />,
    );

    await user.press(screen.getByRole('button', { name: '문의 및 피드백' }));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '메일 앱을 열 수 없습니다',
        'hello.appworks@gmail.com으로 문의해 주세요.',
      );
    });
  });
});
