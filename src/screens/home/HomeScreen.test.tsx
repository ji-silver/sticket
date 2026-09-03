import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from './HomeScreen';
import { useGetTicketBooks } from '../../features/ticket-book/api/useGetTicketBooks';
import { useGetBucketList } from '../../features/bucket-list/api/useGetBucketList';
import { useDeleteTicketBook } from '../../features/ticket-book/api/useDeleteTicketBook';
import { useCreateBucketItem } from '../../features/bucket-list/api/useCreateBucketItem';
import { useDeleteBucketItem } from '../../features/bucket-list/api/useDeleteBucketItem';
import { useRestoreBucketItem } from '../../features/bucket-list/api/useRestoreBucketItem';
import { useUpdateBucketItemCompleted } from '../../features/bucket-list/api/useUpdateBucketItemCompleted';
import { useUpdateBucketItemTitle } from '../../features/bucket-list/api/useUpdateBucketItemTitle';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const ReactMock = require('react');
  return {
    ...actualNav,
    useFocusEffect: (cb: any) => {
      ReactMock.useEffect(() => {
        const cleanup = cb();
        return () => {
          if (cleanup) cleanup();
        };
      }, [cb]);
    },
  };
});

jest.mock('../../components/common/AppPopoverMenu.tsx', () => {
  const ReactMock = require('react');
  const { Pressable, Text, View } = require('react-native');

  return function MockAppPopoverMenu({ visible, actions }: any) {
    if (!visible) return null;

    return ReactMock.createElement(
      View,
      null,
      actions.map((action: any) =>
        ReactMock.createElement(
          Pressable,
          {
            key: action.accessibilityLabel ?? action.label,
            accessibilityRole: 'button',
            accessibilityLabel: action.accessibilityLabel ?? action.label,
            onPress: action.onPress,
          },
          ReactMock.createElement(Text, null, action.label),
        ),
      ),
    );
  };
});

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('../../features/ticket-book/api/useGetTicketBooks', () => ({
  useGetTicketBooks: jest.fn(),
}));
jest.mock('../../features/bucket-list/api/useGetBucketList', () => ({
  useGetBucketList: jest.fn(),
}));
jest.mock('../../features/ticket-book/api/useDeleteTicketBook', () => ({
  useDeleteTicketBook: jest.fn(),
}));
jest.mock('../../features/bucket-list/api/useCreateBucketItem', () => ({
  useCreateBucketItem: jest.fn(),
}));
jest.mock('../../features/bucket-list/api/useDeleteBucketItem', () => ({
  useDeleteBucketItem: jest.fn(),
}));
jest.mock('../../features/bucket-list/api/useRestoreBucketItem', () => ({
  useRestoreBucketItem: jest.fn(),
}));
jest.mock(
  '../../features/bucket-list/api/useUpdateBucketItemCompleted',
  () => ({ useUpdateBucketItemCompleted: jest.fn() }),
);
jest.mock('../../features/bucket-list/api/useUpdateBucketItemTitle', () => ({
  useUpdateBucketItemTitle: jest.fn(),
}));

describe('HomeScreen', () => {
  const mockCreateBucketMutateAsync = jest.fn();
  const mockUpdateCompletedMutateAsync = jest.fn();
  const mockUpdateTitleMutateAsync = jest.fn();
  const mockDeleteBucketMutateAsync = jest.fn();
  const mockRestoreBucketMutateAsync = jest.fn();
  const mockDeleteTicketBookMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // 기본 mutation 훅 모킹
    (useDeleteTicketBook as jest.Mock).mockReturnValue({
      mutateAsync: mockDeleteTicketBookMutateAsync,
    });
    (useCreateBucketItem as jest.Mock).mockReturnValue({
      mutateAsync: mockCreateBucketMutateAsync,
    });
    (useUpdateBucketItemCompleted as jest.Mock).mockReturnValue({
      mutateAsync: mockUpdateCompletedMutateAsync,
    });
    (useUpdateBucketItemTitle as jest.Mock).mockReturnValue({
      mutateAsync: mockUpdateTitleMutateAsync,
    });
    (useDeleteBucketItem as jest.Mock).mockReturnValue({
      mutateAsync: mockDeleteBucketMutateAsync,
    });
    (useRestoreBucketItem as jest.Mock).mockReturnValue({
      mutateAsync: mockRestoreBucketMutateAsync,
    });

    (useGetTicketBooks as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    (useGetBucketList as jest.Mock).mockReturnValue({
      data: [],
      isError: false,
    });
  });

  describe('초기 데이터 로딩 로직', () => {
    it('API 통신에 성공하면 서버에서 받아온 티켓북과 버킷리스트를 화면에 렌더링한다', async () => {
      (useGetTicketBooks as jest.Mock).mockReturnValue({
        data: [
          {
            id: 'ticket-1',
            sport: 'baseball',
            coverColor: '#DF9EAF',
            coverPattern: 'solid',
          },
        ],
        isLoading: false,
        isError: false,
      });
      (useGetBucketList as jest.Mock).mockReturnValue({
        data: [
          {
            id: 'bucket-1',
            ticketBookId: 'ticket-1',
            title: '야구장 가서 치킨 먹기',
            isCompleted: false,
            displayOrder: 0,
          },
        ],
        isError: false,
      });

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('야구장 가서 치킨 먹기')).toBeVisible();
      });
      expect(screen.queryByText('다이어리 추가')).toBeNull();
    });

    it('티켓북 데이터가 비어있을 경우 빈 상태에 맞게 화면을 처리한다', async () => {
      await render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.queryByText('다이어리 추가')).toBeNull();
      });
    });

    it('데이터 로딩 중 서버 통신 에러가 발생하면 안내 팝업을 띄운다', async () => {
      (useGetTicketBooks as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
      });

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '홈 정보를 불러오지 못했어요',
          '잠시 후 다시 시도해 주세요.',
        );
      });
    });
  });

  describe('화면 네비게이션 로직', () => {
    it('티켓북이 없을 때 만들기 버튼을 누르면 AddDiary 화면으로 이동한다', async () => {
      const user = userEvent.setup();

      await render(<HomeScreen />);

      const addButton = await screen.findByRole('button', {
        name: '티켓북 만들기',
      });
      await user.press(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('AddDiary');
    });

    it('기록이 있는 티켓북은 메뉴에서 삭제하지 않는다', async () => {
      const user = userEvent.setup();
      (useGetTicketBooks as jest.Mock).mockReturnValue({
        data: [
          {
            id: 'ticket-1',
            sport: 'baseball',
            recordCount: 1,
            coverColor: '#DF9EAF',
            coverPattern: 'solid',
          },
        ],
        isLoading: false,
        isError: false,
      });

      await render(<HomeScreen />);

      await user.press(
        await screen.findByRole('button', { name: '야구 티켓북 메뉴' }),
      );
      await user.press(screen.getByRole('button', { name: '티켓북 삭제하기' }));

      expect(Alert.alert).toHaveBeenCalledWith(
        '삭제할 수 없어요',
        '기록이 있는 티켓북은 삭제할 수 없어요.',
      );
      expect(mockDeleteTicketBookMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('버킷리스트 인터랙션 및 서버 연동 로직', () => {
    beforeEach(() => {
      (useGetTicketBooks as jest.Mock).mockReturnValue({
        data: [
          {
            id: 'ticket-1',
            sport: 'baseball',
            coverColor: '#DF9EAF',
            coverPattern: 'solid',
            title: '야구',
          },
        ],
        isLoading: false,
        isError: false,
      });
      (useGetBucketList as jest.Mock).mockReturnValue({
        data: [
          {
            id: 'bucket-1',
            ticketBookId: 'ticket-1',
            title: '기존 버킷리스트',
            isCompleted: false,
            displayOrder: 0,
          },
        ],
        isError: false,
      });
    });

    it('버킷리스트 완료 체크박스를 누르면 완료 상태가 서버로 전송된다', async () => {
      const user = userEvent.setup();
      mockUpdateCompletedMutateAsync.mockResolvedValueOnce(true);

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('기존 버킷리스트')).toBeVisible();
      });

      expect(
        screen.getByText('기존 버킷리스트').props.numberOfLines,
      ).toBeUndefined();

      const checkbox = screen.getByRole('checkbox', {
        name: '기존 버킷리스트 완료',
      });
      await user.press(checkbox);

      expect(mockUpdateCompletedMutateAsync).toHaveBeenCalledWith({
        bucketItemId: 'bucket-1',
        isCompleted: true,
      });
    });

    it('추가 버튼을 누르고 새 버킷리스트를 추가하면 생성 API가 호출된다', async () => {
      const user = userEvent.setup();
      (useGetBucketList as jest.Mock).mockReturnValue({
        data: [],
        isError: false,
      });
      mockCreateBucketMutateAsync.mockResolvedValueOnce({
        id: 'bucket-2',
        ticketBookId: 'ticket-1',
        title: '새로운 직관 목표',
        isCompleted: false,
        displayOrder: 1,
      });

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '추가' })).toBeVisible();
      });
      expect(
        screen.queryByRole('button', { name: '첫 직관 목표 추가' }),
      ).toBeNull();

      await user.press(screen.getByRole('button', { name: '추가' }));

      const input = screen.getByLabelText('새 버킷리스트 목표');
      await user.type(input, '새로운 직관 목표');

      const submitButton = screen.getByRole('button', {
        name: '버킷리스트 추가',
      });
      await user.press(submitButton);

      expect(mockCreateBucketMutateAsync).toHaveBeenCalledWith({
        ticketBookId: 'ticket-1',
        title: '새로운 직관 목표',
      });
    });

    it('버킷리스트 메뉴에서 수정 화면을 열 수 있다', async () => {
      const user = userEvent.setup();

      await render(<HomeScreen />);

      expect(
        screen.queryByRole('button', { name: '기존 버킷리스트 수정' }),
      ).toBeNull();

      await user.press(
        await screen.findByRole('button', {
          name: '기존 버킷리스트 메뉴',
        }),
      );
      await user.press(
        screen.getByRole('button', { name: '버킷리스트 수정하기' }),
      );

      expect(await screen.findByLabelText('버킷리스트 내용')).toBeVisible();
    });

    it('버킷리스트 메뉴에서 항목을 삭제하고 실행 취소할 수 있다', async () => {
      const user = userEvent.setup();
      mockDeleteBucketMutateAsync.mockResolvedValueOnce(true);
      mockRestoreBucketMutateAsync.mockResolvedValueOnce(true);

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: '기존 버킷리스트 메뉴' }),
        ).toBeVisible();
      });

      await user.press(
        screen.getByRole('button', { name: '기존 버킷리스트 메뉴' }),
      );

      const deleteButton = screen.getByRole('button', {
        name: '버킷리스트 삭제하기',
      });
      await user.press(deleteButton);

      expect(mockDeleteBucketMutateAsync).toHaveBeenCalledWith('bucket-1');

      const undoButton = await screen.findByRole('button', {
        name: '버킷리스트 삭제 실행 취소',
      });
      await user.press(undoButton);

      expect(mockRestoreBucketMutateAsync).toHaveBeenCalledWith({
        id: 'bucket-1',
        ticketBookId: 'ticket-1',
        title: '기존 버킷리스트',
        isCompleted: false,
        displayOrder: 0,
      });
    });
  });
});
