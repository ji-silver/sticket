import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileSetupScreen from './ProfileSetupScreen';
import { saveProfile } from '../../features/profile/profile.service';
import { useAuth } from '../../features/auth/AuthProvider';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('../../features/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../features/profile/profile.service.ts', () => ({
  saveProfile: jest.fn(),
}));

jest.mock('../home/components/TeamSelectSheet.tsx', () => {
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

describe('ProfileSetupScreen', () => {
  const mockCompleteProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      profile: null,
      completeProfile: mockCompleteProfile,
    });
  });

  const setup = async () => {
    return render(<ProfileSetupScreen />);
  };

  describe('화면 초기화 및 렌더링', () => {
    it('기존 프로필 데이터가 없으면, 닉네임과 응원 구단이 비어있는 상태로 렌더링된다', async () => {
      await setup();

      const nicknameInput = screen.getByLabelText('닉네임');
      expect(nicknameInput.props.value).toBe('');

      expect(screen.getByText('응원 구단을 선택해 주세요')).toBeVisible();
    });

    it('기존 프로필 데이터가 있으면, 해당 데이터로 폼이 미리 채워진다', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        profile: { nickname: '기존유저', favorite_team: { name: 'LG 트윈스' } },
        completeProfile: mockCompleteProfile,
      });

      await setup();

      const nicknameInput = screen.getByLabelText('닉네임');
      expect(nicknameInput.props.value).toBe('기존유저');
      expect(screen.getByText('LG 트윈스')).toBeVisible();
    });
  });

  describe('유효성 검사 및 UI 상태', () => {
    it('닉네임만 유효하게 입력하고 구단을 미선택하면 시작하기 버튼은 비활성화된다', async () => {
      await setup();

      const startButton =
        screen.getByLabelText('프로필 설정 완료하고 시작하기');
      expect(startButton).toBeDisabled();

      const nicknameInput = screen.getByLabelText('닉네임');
      fireEvent.changeText(nicknameInput, '스티켓');

      await waitFor(() => {
        expect(startButton).toBeDisabled();
      });
    });

    it('구단만 선택하고 닉네임을 미입력하면 시작하기 버튼은 비활성화된다', async () => {
      await setup();

      const startButton =
        screen.getByLabelText('프로필 설정 완료하고 시작하기');

      const teamSelectButton = screen.getByLabelText('응원 구단 선택');
      fireEvent.press(teamSelectButton);

      const mockTeamOption = await screen.findByText('두산 베어스 선택');
      fireEvent.press(mockTeamOption);

      await waitFor(() => {
        expect(startButton).toBeDisabled();
      });
    });
  });

  describe('API 통신 및 저장', () => {
    it('모든 유효성을 통과하고 버튼을 누르면 API가 호출되고 홈 화면으로 이동한다', async () => {
      const fakeSavedProfile = {
        nickname: '스티켓유저',
        favoriteTeamName: '두산 베어스',
      };
      (saveProfile as jest.Mock).mockResolvedValueOnce(fakeSavedProfile);

      await setup();

      const nicknameInput = screen.getByLabelText('닉네임');
      fireEvent.changeText(nicknameInput, '스티켓유저');
      await screen.findByDisplayValue('스티켓유저');

      const teamSelectButton = screen.getByLabelText('응원 구단 선택');
      fireEvent.press(teamSelectButton);

      const mockTeamOption = await screen.findByText('두산 베어스 선택');
      fireEvent.press(mockTeamOption);

      await waitFor(() => {
        expect(
          screen.getByLabelText('프로필 설정 완료하고 시작하기'),
        ).not.toBeDisabled();
      });

      const startButton =
        screen.getByLabelText('프로필 설정 완료하고 시작하기');
      fireEvent.press(startButton);

      await waitFor(() => {
        expect(saveProfile).toHaveBeenCalledWith({
          nickname: '스티켓유저',
          favoriteTeamName: '두산 베어스',
        });
      });

      expect(mockCompleteProfile).toHaveBeenCalledWith(fakeSavedProfile);
    });

    it('프로필 저장 중 서버 에러가 발생하면, 알림 팝업을 띄운다', async () => {
      (saveProfile as jest.Mock).mockRejectedValueOnce(
        new Error('Server Error'),
      );

      await setup();

      const nicknameInput = screen.getByLabelText('닉네임');
      fireEvent.changeText(nicknameInput, '스티켓유저');
      await screen.findByDisplayValue('스티켓유저');

      const teamSelectButton = screen.getByLabelText('응원 구단 선택');
      fireEvent.press(teamSelectButton);

      const mockTeamOption = await screen.findByText('두산 베어스 선택');
      fireEvent.press(mockTeamOption);

      await waitFor(() => {
        expect(
          screen.getByLabelText('프로필 설정 완료하고 시작하기'),
        ).not.toBeDisabled();
      });

      const startButton =
        screen.getByLabelText('프로필 설정 완료하고 시작하기');
      fireEvent.press(startButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '프로필을 저장하지 못했어요',
          '잠시 후 다시 시도해 주세요.',
        );
      });

      await waitFor(() => {
        expect(startButton).not.toBeDisabled();
      });

      expect(mockCompleteProfile).not.toHaveBeenCalled();
    });
  });
});
