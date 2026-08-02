import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from './HomeScreen';
import { getTicketBooks } from '../../features/ticket-book/ticketBook.service';
import {
  createBucketItem,
  deleteBucketItem,
  getBucketItems,
  updateBucketItemCompleted,
} from '../../features/bucket-list/bucketList.service';

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

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('../../features/ticket-book/ticketBook.service', () => ({
  getTicketBooks: jest.fn(),
  deleteTicketBook: jest.fn(),
}));

jest.mock('../../features/bucket-list/bucketList.service', () => ({
  getBucketItems: jest.fn(),
  createBucketItem: jest.fn(),
  updateBucketItemCompleted: jest.fn(),
  updateBucketItemTitle: jest.fn(),
  deleteBucketItem: jest.fn(),
  restoreBucketItem: jest.fn(),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('초기 데이터 로딩 로직', () => {
    it('API 통신에 성공하면 서버에서 받아온 티켓북과 버킷리스트를 화면에 렌더링한다', async () => {
      (getTicketBooks as jest.Mock).mockResolvedValueOnce([
        {
          id: 'ticket-1',
          sport: 'baseball',
          coverColor: '#DF9EAF',
          coverPattern: 'solid',
        },
      ]);
      (getBucketItems as jest.Mock).mockResolvedValueOnce([
        {
          id: 'bucket-1',
          ticketBookId: 'ticket-1',
          title: '야구장 가서 치킨 먹기',
          isCompleted: false,
        },
      ]);

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('야구장 가서 치킨 먹기')).toBeVisible();
      });
      expect(screen.getByText('다이어리 추가')).toBeVisible();
    });

    it('티켓북 데이터가 비어있을 경우 빈 상태에 맞게 화면을 처리한다', async () => {
      (getTicketBooks as jest.Mock).mockResolvedValueOnce([]);
      (getBucketItems as jest.Mock).mockResolvedValueOnce([]);

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.queryByText('다이어리 추가')).toBeNull();
      });
    });

    it('데이터 로딩 중 서버 통신 에러가 발생하면 안내 팝업을 띄운다', async () => {
      (getTicketBooks as jest.Mock).mockRejectedValueOnce(
        new Error('500 Server Error'),
      );

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
    it('헤더의 다이어리 추가 버튼을 누르면 AddDiary 화면으로 이동한다', async () => {
      const user = userEvent.setup();
      (getTicketBooks as jest.Mock).mockResolvedValueOnce([
        {
          id: 'ticket-1',
          sport: 'baseball',
          coverColor: '#DF9EAF',
          coverPattern: 'solid',
        },
      ]);
      (getBucketItems as jest.Mock).mockResolvedValueOnce([]);

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('다이어리 추가')).toBeVisible();
      });

      const addButton = screen.getByText('다이어리 추가');
      await user.press(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('AddDiary');
    });
  });

  describe('버킷리스트 인터랙션 및 서버 연동 로직', () => {
    beforeEach(() => {
      (getTicketBooks as jest.Mock).mockResolvedValue([
        {
          id: 'ticket-1',
          sport: 'baseball',
          coverColor: '#DF9EAF',
          coverPattern: 'solid',
          title: '야구',
        },
      ]);
      (getBucketItems as jest.Mock).mockResolvedValue([
        {
          id: 'bucket-1',
          ticketBookId: 'ticket-1',
          title: '기존 버킷리스트',
          isCompleted: false,
        },
      ]);
    });

    it('버킷리스트 완료 체크박스를 누르면 완료 상태가 서버로 전송된다', async () => {
      const user = userEvent.setup();
      (updateBucketItemCompleted as jest.Mock).mockResolvedValueOnce(true);

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('기존 버킷리스트')).toBeVisible();
      });

      const checkbox = screen.getByRole('checkbox', {
        name: '기존 버킷리스트 완료',
      });
      await user.press(checkbox);

      expect(updateBucketItemCompleted).toHaveBeenCalledWith('bucket-1', true);
    });

    it('수정 버튼을 누르고 새 버킷리스트를 추가하면 생성 API가 호출된다', async () => {
      const user = userEvent.setup();
      (createBucketItem as jest.Mock).mockResolvedValueOnce({
        id: 'bucket-2',
        ticketBookId: 'ticket-1',
        title: '새로운 직관 목표',
        isCompleted: false,
      });

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('수정')).toBeVisible();
      });

      const editButton = screen.getByText('수정');
      await user.press(editButton);

      const input = screen.getByLabelText('새 버킷리스트 목표');
      await user.type(input, '새로운 직관 목표');

      const submitButton = screen.getByRole('button', {
        name: '버킷리스트 추가',
      });
      await user.press(submitButton);

      expect(createBucketItem).toHaveBeenCalledWith(
        'ticket-1',
        '새로운 직관 목표',
      );
    });

    it('버킷리스트 편집 모달에서 항목의 삭제 버튼을 누르면 삭제 API가 호출된다', async () => {
      const user = userEvent.setup();
      (deleteBucketItem as jest.Mock).mockResolvedValueOnce(true);

      await render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('수정')).toBeVisible();
      });

      const editButton = screen.getByText('수정');
      await user.press(editButton);

      const deleteButton = screen.getByRole('button', {
        name: '기존 버킷리스트 삭제',
      });
      await user.press(deleteButton);

      expect(deleteBucketItem).toHaveBeenCalledWith('bucket-1');
    });
  });
});
