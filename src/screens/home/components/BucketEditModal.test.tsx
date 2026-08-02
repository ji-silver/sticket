import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import BucketEditModal from './BucketEditModal';
import { Bucket } from '../types';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

afterEach(() => {
  cleanup();
});

describe('BucketEditModal', () => {
  const mockOnClose = jest.fn();
  const mockOnToggleBucket = jest.fn();
  const mockOnAddBucket = jest.fn();
  const mockOnUpdateBucket = jest.fn();
  const mockOnDeleteBucket = jest.fn();
  const mockOnRestoreBucket = jest.fn();

  const mockBuckets: Bucket[] = [
    {
      id: 'b1',
      ticketBookId: 't1',
      title: '기존 목표 1',
      isCompleted: false,
      displayOrder: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (buckets = mockBuckets) => {
    return render(
      <BucketEditModal
        visible={true}
        buckets={buckets}
        title="버킷리스트 수정"
        onClose={mockOnClose}
        onToggleBucket={mockOnToggleBucket}
        onAddBucket={mockOnAddBucket}
        onUpdateBucket={mockOnUpdateBucket}
        onDeleteBucket={mockOnDeleteBucket}
        onRestoreBucket={mockOnRestoreBucket}
        pendingBucketIds={new Set()}
      />,
    );
  };

  describe('텍스트 입력 유효성 검사', () => {
    it('새 목표 입력창에 공백만 입력 후 추가를 시도하면, 무시하고 API를 호출하지 않는다', async () => {
      const user = userEvent.setup();
      await setup();

      const input = screen.getByLabelText('새 버킷리스트 목표');
      await user.type(input, '   ');

      const addButton = screen.getByRole('button', { name: '버킷리스트 추가' });
      await user.press(addButton);

      expect(mockOnAddBucket).not.toHaveBeenCalled();
    });

    it('기존 항목을 수정할 때 내용을 모두 지우고 엔터를 누르면, 경고 팝업을 띄우고 API를 호출하지 않는다', async () => {
      await setup();

      const editInput = screen.getByDisplayValue('기존 목표 1');

      fireEvent.changeText(editInput, '');

      // 상태(draftTitles)가 업데이트될 때까지 대기
      await waitFor(() => {
        expect(editInput.props.value).toBe('');
      });

      fireEvent(editInput, 'submitEditing');

      expect(mockOnUpdateBucket).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('내용을 입력해 주세요');
    });
  });

  describe('실행 취소 로직', () => {
    it('항목을 삭제하면 하단에 실행 취소 스낵바가 나타나고, 취소를 누르면 복원 API가 호출된다', async () => {
      const user = userEvent.setup();
      mockOnDeleteBucket.mockResolvedValueOnce(true);
      mockOnRestoreBucket.mockResolvedValueOnce(true);

      await setup();

      const deleteButton = screen.getByRole('button', {
        name: '기존 목표 1 삭제',
      });
      await user.press(deleteButton);

      expect(mockOnDeleteBucket).toHaveBeenCalledWith('b1');

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: '버킷리스트 삭제 실행 취소' }),
        ).toBeVisible();
      });

      const undoButton = screen.getByRole('button', {
        name: '버킷리스트 삭제 실행 취소',
      });
      await user.press(undoButton);

      expect(mockOnRestoreBucket).toHaveBeenCalledWith(
        {
          id: 'b1',
          ticketBookId: 't1',
          title: '기존 목표 1',
          isCompleted: false,
          displayOrder: 0,
        },
        0, // 인덱스 0에서 지웠으므로 0으로 복원
      );
    });
  });
});
