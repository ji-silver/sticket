import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProfileEditScreen from './ProfileEditScreen';
import { useAuth } from '../../features/auth/AuthProvider';
import { useUpdateProfile } from '../../features/profile/api/useUpdateProfile';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../../features/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../features/profile/api/useUpdateProfile.ts', () => ({
  useUpdateProfile: jest.fn(),
}));

jest.mock('../../lib/date.ts', () => ({
  getTodayInKorea: () => '2026-08-24',
}));

jest.mock('./components/TeamSelectSheet.tsx', () => {
  const { View, Pressable, Text } = require('react-native');
  return function MockTeamSelectSheet({ visible, onSelect, onClose }: any) {
    if (!visible) return null;
    return (
      <View testID="mock-team-sheet">
        <Pressable
          onPress={() => onSelect('두산 베어스')}
          accessibilityRole="button"
        >
          <Text>두산 베어스 선택</Text>
        </Pressable>
        <Pressable onPress={onClose} accessibilityRole="button">
          <Text>닫기</Text>
        </Pressable>
      </View>
    );
  };
});

describe('ProfileEditScreen', () => {
  const mockCompleteProfile = jest.fn();
  const mockGoBack = jest.fn();
  let mockMutate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    (useNavigation as jest.Mock).mockReturnValue({
      goBack: mockGoBack,
    });

    (useAuth as jest.Mock).mockReturnValue({
      profile: {
        nickname: '기존유저',
        favorite_team_id: 'lg',
        favorite_team: { name: 'LG 트윈스' },
        season_ticket_seat_name: '1루 응원지정석 23블록',
        season_ticket_season: 2026,
        season_ticket_team_id: 'lg',
      },
      completeProfile: mockCompleteProfile,
    });

    mockMutate = jest.fn().mockImplementation((data, options) => {
      if (options && options.onSuccess) {
        options.onSuccess({
          nickname: data.nickname,
          favoriteTeamName: data.favoriteTeamName,
        });
      }
    });

    (useUpdateProfile as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  const setup = async () => {
    return render(<ProfileEditScreen />);
  };

  describe('화면 렌더링 및 초기화', () => {
    it('기존 프로필 데이터가 있으면, 해당 데이터로 폼이 미리 채워진다', async () => {
      await setup();

      const nicknameInput = screen.getByLabelText('닉네임');
      expect(nicknameInput.props.value).toBe('기존유저');
      expect(screen.getByText('LG 트윈스')).toBeVisible();
      expect(screen.getByLabelText('2026 시즌권 좌석').props.value).toBe(
        '1루 응원지정석 23블록',
      );
    });
  });

  describe('유효성 검사 및 UI 상태', () => {
    it('닉네임을 지워버리거나 2자 미만으로 입력하면 저장 버튼이 비활성화된다', async () => {
      await setup();

      const saveButton = screen.getByRole('button', { name: '저장' });
      expect(saveButton).not.toBeDisabled();

      const nicknameInput = screen.getByLabelText('닉네임');
      // 1글자만 입력
      fireEvent.changeText(nicknameInput, '가');
      await screen.findByDisplayValue('가');

      // 2자 미만이므로 비활성화되어야 함
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });

    it('입력 폼이 모두 유효해도 폼 제출중이라면 저장 버튼은 비활성화된다', async () => {
      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      });

      await setup();

      const savingButton = screen.getByRole('button', { name: '저장 중' });
      expect(savingButton).toBeDisabled();
    });
  });

  describe('API 통신 및 저장', () => {
    it('모든 유효성을 통과하고 버튼을 누르면 API가 호출되고 이전 화면으로 돌아간다', async () => {
      await setup();

      const nicknameInput = screen.getByLabelText('닉네임');
      fireEvent.changeText(nicknameInput, '새로운유저');
      await screen.findByDisplayValue('새로운유저');

      const teamSelectButton = screen.getByLabelText(
        '야구 응원 구단, LG 트윈스, 변경',
      );
      fireEvent.press(teamSelectButton);

      const mockTeamOption = await screen.findByText('두산 베어스 선택');
      fireEvent.press(mockTeamOption);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '저장' })).not.toBeDisabled();
      });

      const saveButton = screen.getByRole('button', { name: '저장' });
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          {
            nickname: '새로운유저',
            favoriteTeamName: '두산 베어스',
            seasonTicketSeat: null,
          },
          expect.any(Object),
        );
      });

      expect(mockCompleteProfile).toHaveBeenCalled();
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('프로필 수정 중 서버 에러가 발생하면, 안내 팝업을 띄운다', async () => {
      mockMutate = jest.fn().mockImplementation((data, options) => {
        if (options && options.onError) {
          options.onError(new Error('Server Error'));
        }
      });

      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      await setup();

      const saveButton = screen.getByRole('button', { name: '저장' });
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '프로필을 수정하지 못했어요',
          '잠시 후 다시 시도해 주세요.',
        );
      });

      expect(mockCompleteProfile).not.toHaveBeenCalled();
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });
});
