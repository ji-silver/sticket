import React from 'react';
import { render, screen, userEvent, waitFor } from '../../test-utils';
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

      const photoButton = screen.getByRole('button', { name: '사진 추가' });
      await user.press(photoButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '사진 변경' })).toBeVisible();
      });
    });

    it('미리보기의 포토카드 영역에서도 사진을 선택할 수 있다', async () => {
      const user = userEvent.setup();
      (ImagePicker.openPicker as jest.Mock).mockResolvedValueOnce({
        path: 'test-uri',
        data: 'base64-string',
      });

      await render(<AddDiaryScreen />);
      await user.press(
        screen.getByRole('button', { name: '포토카드 사진 추가' }),
      );

      expect(
        await screen.findByRole('button', { name: '사진 제거' }),
      ).toBeVisible();
    });

    it('선택한 사진을 제거하면 사진 없이 새 티켓북을 만든다', async () => {
      const user = userEvent.setup();
      (ImagePicker.openPicker as jest.Mock).mockResolvedValueOnce({
        path: 'test-uri',
        data: 'base64-string',
      });
      (createTicketBook as jest.Mock).mockResolvedValueOnce({});

      await render(<AddDiaryScreen />);
      await user.press(screen.getByRole('button', { name: '사진 추가' }));
      await user.press(
        await screen.findByRole('button', { name: '사진 제거' }),
      );
      await user.press(screen.getByRole('button', { name: '티켓북 만들기' }));

      expect(createTicketBook).toHaveBeenCalledWith({
        sport: 'baseball',
        coverColor: '#DF9EAF',
        coverPattern: 'solid',
        coverImageBase64: undefined,
      });
    });

    it('사용자가 갤러리 선택을 취소하더라도 불필요한 예외 처리가 발생하지 않는다', async () => {
      const user = userEvent.setup();
      (ImagePicker.openPicker as jest.Mock).mockRejectedValueOnce({
        code: 'E_PICKER_CANCELLED',
      });

      await render(<AddDiaryScreen />);

      const photoButton = screen.getByRole('button', { name: '사진 추가' });
      await user.press(photoButton);

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('야구 생성 화면에는 지원 전 종목을 선택하는 버튼이 없다', async () => {
      const user = userEvent.setup();
      await render(<AddDiaryScreen />);

      expect(screen.queryByRole('button', { name: /축구/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /농구/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /배구/ })).toBeNull();
      expect(screen.getByRole('header', { name: '새 티켓북' })).toBeVisible();
      expect(screen.getByText('종목')).toBeVisible();
      const baseballButton = screen.getByRole('button', { name: '야구' });
      await user.press(baseballButton);
      expect(baseballButton).toBeSelected();
      expect(
        screen.getByRole('button', { name: '티켓북 만들기' }),
      ).toBeEnabled();
    });

    it('표지 색상과 패턴을 선택하면 선택한 값으로 티켓북을 만든다', async () => {
      const user = userEvent.setup();
      (createTicketBook as jest.Mock).mockResolvedValueOnce({});
      await render(<AddDiaryScreen />);

      const stripeButton = screen.getByRole('button', {
        name: '흰색 스트라이프 표지',
      });
      await user.press(stripeButton);
      expect(stripeButton).toBeSelected();
      await user.press(screen.getByRole('button', { name: '티켓북 만들기' }));

      expect(createTicketBook).toHaveBeenCalledWith({
        sport: 'baseball',
        coverColor: '#F8F8F8',
        coverPattern: 'stripe',
        coverImageBase64: undefined,
      });
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
        const consoleError = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});
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
        consoleError.mockRestore();
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

      it('기존 포토카드를 제거하고 저장하면 사진 삭제 의도를 전달한다', async () => {
        const user = userEvent.setup();
        (updateTicketBook as jest.Mock).mockResolvedValueOnce({});
        await render(<AddDiaryScreen />);

        await user.press(screen.getByRole('button', { name: '사진 제거' }));
        expect(screen.getByRole('button', { name: '사진 추가' })).toBeVisible();
        await user.press(screen.getByRole('button', { name: '수정하기' }));

        expect(updateTicketBook).toHaveBeenCalledWith({
          ticketBookId: 99,
          coverColor: '#DF9EAF',
          coverPattern: 'solid',
          coverImageBase64: null,
        });
      });
    });
  });
});
