import React from 'react';
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from '@testing-library/react-native';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import FloatingTabBar from './FloatingTabBar';

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

function createProps(index = 0) {
  const routes = [
    { key: 'home', name: 'Home' },
    { key: 'calendar', name: 'Calendar' },
    { key: 'profile', name: 'Profile' },
  ];
  const emit = jest.fn().mockReturnValue({ defaultPrevented: false });
  const navigate = jest.fn();
  const props = {
    state: {
      stale: false,
      type: 'tab',
      key: 'main',
      index,
      routeNames: routes.map(route => route.name),
      routes,
      history: [{ type: 'route', key: routes[index].key }],
      preloadedRouteKeys: [],
    },
    descriptors: {
      home: { options: { title: '홈' } },
      calendar: { options: { title: '캘린더' } },
      profile: { options: { title: '프로필' } },
    },
    navigation: { emit, navigate },
    insets: { top: 0, right: 0, bottom: 34, left: 0 },
  } as unknown as BottomTabBarProps;

  return { props, emit, navigate };
}

describe('FloatingTabBar', () => {
  it('측정된 전체 높이를 내비게이터에 전달해 콘텐츠가 바 위까지 스크롤될 수 있게 한다', async () => {
    const { props } = createProps();
    const onHeightChange = jest.fn();
    await render(
      <BottomTabBarHeightCallbackContext.Provider value={onHeightChange}>
        <FloatingTabBar {...props} />
      </BottomTabBarHeightCallbackContext.Provider>,
    );

    await fireEvent(screen.getByTestId('floating-tab-bar'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 744, width: 393, height: 108 } },
    });

    expect(onHeightChange).toHaveBeenCalledWith(108);
  });

  it('세 탭의 이름과 현재 선택 상태를 표시하고 내비게이션 상태 변경을 반영한다', async () => {
    const { props } = createProps();
    const { rerender } = await render(<FloatingTabBar {...props} />);

    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: '홈' })).toBeSelected();
    expect(screen.getByRole('tab', { name: '캘린더' })).not.toBeSelected();
    expect(screen.getByRole('tab', { name: '프로필' })).toBeVisible();

    await rerender(
      <FloatingTabBar {...props} state={{ ...props.state, index: 1 }} />,
    );

    expect(screen.getByRole('tab', { name: '캘린더' })).toBeSelected();
    expect(screen.getByRole('tab', { name: '홈' })).not.toBeSelected();
  });

  it('다른 탭을 누르면 tabPress 이벤트 후 해당 화면으로 이동한다', async () => {
    const { props, emit, navigate } = createProps();
    const user = userEvent.setup();
    await render(<FloatingTabBar {...props} />);

    await user.press(screen.getByRole('tab', { name: '캘린더' }));

    expect(emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'calendar',
      canPreventDefault: true,
    });
    expect(navigate).toHaveBeenCalledWith('Calendar', undefined);
    expect(emit.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0],
    );
  });

  it('선택된 탭을 다시 눌러도 재탐색하지 않고 tabPress는 전달한다', async () => {
    const { props, emit, navigate } = createProps();
    await render(<FloatingTabBar {...props} />);

    await fireEvent.press(screen.getByRole('tab', { name: '홈' }));

    expect(emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'home',
      canPreventDefault: true,
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('화면이 tabPress를 취소하면 선택과 화면 이동을 유지한다', async () => {
    const { props, emit, navigate } = createProps();
    emit.mockReturnValue({ defaultPrevented: true });
    await render(<FloatingTabBar {...props} />);

    await fireEvent.press(screen.getByRole('tab', { name: '프로필' }));

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: '홈' })).toBeSelected();
  });

  it('길게 누르면 tabLongPress를 전달하고 화면은 이동하지 않는다', async () => {
    const { props, emit, navigate } = createProps();
    await render(<FloatingTabBar {...props} />);

    await fireEvent(screen.getByRole('tab', { name: '프로필' }), 'longPress');

    expect(emit).toHaveBeenCalledWith({
      type: 'tabLongPress',
      target: 'profile',
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
