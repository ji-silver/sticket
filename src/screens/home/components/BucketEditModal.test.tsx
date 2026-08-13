import React from 'react';
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import BucketEditModal from './BucketEditModal';
import { Bucket } from '../types';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('BucketEditModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAddBucket = jest.fn();
  const mockOnUpdateBucket = jest.fn();

  const mockBucket: Bucket = {
    id: 'b1',
    ticketBookId: 't1',
    title: '기존 목표',
    isCompleted: false,
    displayOrder: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (bucket: Bucket | null = mockBucket) =>
    render(
      <BucketEditModal
        visible
        bucket={bucket}
        onClose={mockOnClose}
        onAddBucket={mockOnAddBucket}
        onUpdateBucket={mockOnUpdateBucket}
        pending={false}
      />,
    );

  it('입력창 높이를 늘리지 않는다', async () => {
    await setup(null);

    const input = screen.getByLabelText('새 버킷리스트 목표');

    expect(input.props.multiline).toBeFalsy();
  });

  it('새 목표의 앞뒤 공백을 제거해 추가한다', async () => {
    const user = userEvent.setup();
    mockOnAddBucket.mockResolvedValueOnce(true);
    await setup(null);

    const input = screen.getByLabelText('새 버킷리스트 목표');
    await fireEvent.changeText(input, '  첫 직관 목표  ');
    await user.press(screen.getByRole('button', { name: '버킷리스트 추가' }));

    expect(mockOnAddBucket).toHaveBeenCalledWith('첫 직관 목표');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('기존 목표를 비우고 완료를 누르면 저장하지 않는다', async () => {
    await setup();

    const input = screen.getByLabelText('버킷리스트 내용');
    await fireEvent.changeText(input, '   ');
    await fireEvent(input, 'submitEditing');

    expect(mockOnUpdateBucket).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('내용을 입력해 주세요');
  });

  it('수정 시트에는 삭제 동작을 중복 노출하지 않는다', async () => {
    await setup();

    expect(screen.queryByText('삭제하기')).toBeNull();
  });
});
