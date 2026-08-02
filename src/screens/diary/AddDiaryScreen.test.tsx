import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import AddDiaryScreen from './AddDiaryScreen';
import {
  createTicketBook,
  updateTicketBook,
} from '../../features/ticket-book/ticketBook.service';

const mockGoBack = jest.fn();
const mockUseRoute = jest.fn();

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => mockUseRoute(),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('../../features/ticket-book/ticketBook.service', () => ({
  createTicketBook: jest.fn(),
  updateTicketBook: jest.fn(),
}));

describe('AddDiaryScreen (티켓북 폼 비즈니스 로직 검증)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoute.mockReturnValue({ params: {} });
  });

  describe('포토카드 첨부 및 유효성 검사', () => {
    it('갤러리에서 사진을 가져오면 컴포넌트 내부 상태가 업데이트되어 이미지가 첨부된다', async () => {
      const user = userEvent.setup();
      (ImagePicker.openPicker as jest.Mock).mockResolvedValueOnce({
        path: 'test-uri',
        data: 'base64-string',
      });

      await render(<AddDiaryScreen />);

      const photoButton = screen.getByText('이미지 추가');
      await user.press(photoButton);

      await waitFor(() => {
        expect(screen.getByText('이미지 변경')).toBeVisible();
      });
    });

    it('사용자가 갤러리 선택을 취소하더라도 불필요한 예외 처리가 발생하지 않는다', async () => {
      const user = userEvent.setup();
      (ImagePicker.openPicker as jest.Mock).mockRejectedValueOnce({
        code: 'E_PICKER_CANCELLED',
      });

      await render(<AddDiaryScreen />);

      const photoButton = screen.getByText('이미지 추가');
      await user.press(photoButton);

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('야구 외 스포츠(축구 등)을 선택할 경우 폼 제출 로직이 Disabled 된다', async () => {
      const user = userEvent.setup();
      await render(<AddDiaryScreen />);

      const soccerChip = screen.getByText('축구');
      await user.press(soccerChip);

      const submitButton = screen.getByRole('button', {
        name: '티켓북 만들기',
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('폼 제출 및 에러 처리', () => {
    describe('새 티켓북 생성', () => {
      it('정상 제출 시 올바른 페이로드와 함께 createTicketBook API를 호출한다', async () => {
        const user = userEvent.setup();
        (createTicketBook as jest.Mock).mockResolvedValueOnce({});

        await render(<AddDiaryScreen />);

        const submitButton = screen.getByRole('button', {
          name: '티켓북 만들기',
        });
        await user.press(submitButton);

        expect(createTicketBook).toHaveBeenCalledWith({
          sport: 'baseball',
          coverColor: '#DF9EAF',
          coverPattern: 'solid',
          coverImageBase64: undefined,
        });
        expect(mockGoBack).toHaveBeenCalled();
      });

      it('이미 생성된 티켓북이 있다는 에러 반환 시 전용 팝업을 띄운다', async () => {
        const user = userEvent.setup();
        (createTicketBook as jest.Mock).mockRejectedValueOnce({
          code: '23505',
        });

        await render(<AddDiaryScreen />);

        const submitButton = screen.getByRole('button', {
          name: '티켓북 만들기',
        });
        await user.press(submitButton);

        expect(Alert.alert).toHaveBeenCalledWith(
          '이미 야구 티켓북이 있어요',
          '기존 티켓북을 이용해 주세요.',
        );
      });
    });

    describe('기존 티켓북 수정', () => {
      beforeEach(() => {
        mockUseRoute.mockReturnValue({
          params: {
            ticketBook: {
              id: 99,
              sport: 'baseball',
              coverColor: '#DF9EAF',
              coverPattern: 'solid',
              photoUri: 'old-uri',
            },
          },
        });
      });

      it('렌더링 시 상단 타이틀과 제출 버튼 텍스트가 수정 모드에 맞게 변경된다', async () => {
        await render(<AddDiaryScreen />);

        expect(screen.getByText('티켓북 수정')).toBeVisible();
        expect(screen.getByRole('button', { name: '수정하기' })).toBeVisible();
      });

      it('정상 제출 시 수정 대상의 ID값과 함께 updateTicketBook API를 호출한다', async () => {
        const user = userEvent.setup();
        (updateTicketBook as jest.Mock).mockResolvedValueOnce({});

        await render(<AddDiaryScreen />);

        const submitButton = screen.getByRole('button', { name: '수정하기' });
        await user.press(submitButton);

        expect(updateTicketBook).toHaveBeenCalledWith({
          ticketBookId: 99,
          coverColor: '#DF9EAF',
          coverPattern: 'solid',
          coverImageBase64: undefined,
        });
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });
});
