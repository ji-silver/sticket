import { useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoreHorizontal } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/core';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppText from '../../components/common/AppText.tsx';
import AppPopoverMenu from '../../components/common/AppPopoverMenu.tsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.tsx';
import ScreenHeader from '../../components/common/ScreenHeader.tsx';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import TicketDiaryPage, {
  type TicketDiaryPageHandle,
} from './components/diary/TicketDiaryPage.tsx';
import TicketRecordPage from './components/TicketRecordPage.tsx';
import TicketPageOrientationSheet from './components/TicketPageOrientationSheet.tsx';
import { useDeleteTicket } from '../../features/ticket/api/useDeleteTicket';
import { useGetTickets } from '../../features/ticket/api/useGetTickets';
import { useSetTicketPageOrientation } from '../../features/ticket/api/useSetTicketPageOrientation.ts';
import type { TicketDiaryOrientation } from '../../features/ticket/types.ts';

type TicketDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TicketDetailRouteProp = RouteProp<RootStackParamList, 'TicketDetail'>;
type DetailTab = 'record' | 'diary';

function TicketDetailScreen() {
  const navigation = useNavigation<TicketDetailNavigationProp>();
  const route = useRoute<TicketDetailRouteProp>();
  const { ticketId } = route.params;
  const diaryPageRef = useRef<TicketDiaryPageHandle>(null);
  const menuButtonRef = useRef<View>(null);

  const { data: tickets = [] } = useGetTickets();
  const ticket = tickets.find(t => t.id === ticketId);

  const [activeTab, setActiveTab] = useState<DetailTab>('record');
  const [hasOpenedDiary, setHasOpenedDiary] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isResetDialogVisible, setIsResetDialogVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isResettingDiary, setIsResettingDiary] = useState(false);
  const { mutateAsync: removeTicket, isPending: isDeleting } =
    useDeleteTicket();
  const {
    mutateAsync: savePageOrientation,
    data: savedPageOrientation,
    isPending: isSavingPageOrientation,
  } = useSetTicketPageOrientation();

  const pageOrientation =
    savedPageOrientation ?? ticket?.pageOrientation ?? null;

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: activeTab !== 'diary',
    });
  }, [activeTab, navigation]);

  const handleChangeTab = (tab: DetailTab) => {
    Keyboard.dismiss();

    if (tab === 'diary') {
      setHasOpenedDiary(true);
    }

    setActiveTab(tab);
  };

  const handleDeleteTicket = async () => {
    if (isDeleting || !ticket) {
      return;
    }

    try {
      await removeTicket(ticket.id);

      setIsDeleteDialogVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('티켓을 삭제하지 못했습니다.', error);
      Alert.alert('티켓을 삭제하지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  };

  const handleOpenMenu = () => {
    Keyboard.dismiss();
    setIsMenuVisible(true);
  };

  const handleResetDiary = async () => {
    if (isResettingDiary || !diaryPageRef.current) {
      return;
    }

    setIsResettingDiary(true);

    try {
      await diaryPageRef.current.resetDecorations();
      setIsResetDialogVisible(false);
    } catch (error) {
      console.error('다이어리를 초기화하지 못했습니다.', error);
      Alert.alert(
        '다이어리를 초기화하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsResettingDiary(false);
    }
  };

  const handleConfirmPageOrientation = async (
    orientation: TicketDiaryOrientation,
  ) => {
    try {
      await savePageOrientation({ ticketId, orientation });
    } catch (error) {
      console.error('페이지 방향을 저장하지 못했습니다.', error);
      Alert.alert(
        '페이지 방향을 저장하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  if (!ticket) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="직관 기록"
        onPressBack={() => navigation.goBack()}
        right={
          <Pressable
            ref={menuButtonRef}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.menuButtonPressed,
            ]}
            onPress={handleOpenMenu}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="직관 기록 메뉴"
          >
            <MoreHorizontal
              size={22}
              color={colors.textSecondary}
              strokeWidth={2.4}
            />
          </Pressable>
        }
      />

      <View style={styles.tabBar} accessibilityRole="tablist">
        <Pressable
          style={({ pressed }) => [
            styles.tabButton,
            pressed && styles.tabButtonPressed,
          ]}
          onPress={() => handleChangeTab('record')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'record' }}
        >
          <AppText
            style={[
              styles.tabLabel,
              activeTab === 'record' && styles.tabLabelActive,
            ]}
          >
            경기 기록
          </AppText>

          {activeTab === 'record' ? <View style={styles.tabIndicator} /> : null}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.tabButton,
            pressed && styles.tabButtonPressed,
          ]}
          onPress={() => handleChangeTab('diary')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'diary' }}
        >
          <AppText
            style={[
              styles.tabLabel,
              activeTab === 'diary' && styles.tabLabelActive,
            ]}
          >
            다이어리
          </AppText>

          {activeTab === 'diary' ? <View style={styles.tabIndicator} /> : null}
        </Pressable>
      </View>

      <View style={[styles.page, activeTab !== 'record' && styles.hidden]}>
        <TicketRecordPage
          ticket={ticket}
          orientation={pageOrientation ?? 'portrait'}
        />
      </View>

      {hasOpenedDiary ? (
        <View style={[styles.page, activeTab !== 'diary' && styles.hidden]}>
          <TicketDiaryPage
            ref={diaryPageRef}
            key={ticket.id}
            ticketId={ticket.id}
          />
        </View>
      ) : null}

      <TicketPageOrientationSheet
        visible={pageOrientation === null}
        isSaving={isSavingPageOrientation}
        onConfirm={handleConfirmPageOrientation}
      />

      <AppPopoverMenu
        visible={isMenuVisible}
        anchorRef={menuButtonRef}
        onClose={() => setIsMenuVisible(false)}
        actions={[
          ...(activeTab === 'diary'
            ? [
                {
                  label: '다이어리 초기화',
                  disabled: !(
                    diaryPageRef.current?.hasDecorations() ?? false
                  ),
                  onPress: () => setIsResetDialogVisible(true),
                },
              ]
            : []),
          {
            label: '티켓 삭제',
            tone: 'destructive',
            onPress: () => setIsDeleteDialogVisible(true),
          },
        ]}
      />

      <ConfirmDialog
        visible={isResetDialogVisible}
        title="다이어리를 초기화할까요?"
        description="사진, 스티커, 텍스트와 드로잉을 모두 지우고 속지를 기본으로 되돌려요. 이 작업은 되돌릴 수 없어요."
        confirmLabel="초기화"
        confirmTone="destructive"
        isLoading={isResettingDiary}
        onConfirm={handleResetDiary}
        onCancel={() => setIsResetDialogVisible(false)}
      />

      <ConfirmDialog
        visible={isDeleteDialogVisible}
        title="이 기록을 삭제할까요?"
        description="꾸민 페이지도 함께 삭제되며 되돌릴 수 없어요."
        confirmLabel="삭제"
        confirmTone="destructive"
        onConfirm={handleDeleteTicket}
        onCancel={() => setIsDeleteDialogVisible(false)}
      />
    </SafeAreaView>
  );
}

export default TicketDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  page: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  tabBar: {
    height: 48,
    paddingHorizontal: 24,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabButton: {
    position: 'relative',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonPressed: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    width: 56,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
});
