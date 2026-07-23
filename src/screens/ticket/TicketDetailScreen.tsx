import { useLayoutEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2 } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/core';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppText from '../../components/common/AppText.tsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.tsx';
import ScreenHeader from '../../components/common/ScreenHeader.tsx';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { colors } from '../../styles/colors.ts';
import { fonts } from '../../styles/fonts.ts';
import TicketDiaryPage from './components/diary/TicketDiaryPage.tsx';
import TicketRecordPage from './components/TicketRecordPage.tsx';

type TicketDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TicketDetailRouteProp = RouteProp<RootStackParamList, 'TicketDetail'>;
type DetailTab = 'record' | 'diary';

function TicketDetailScreen() {
  const navigation = useNavigation<TicketDetailNavigationProp>();
  const route = useRoute<TicketDetailRouteProp>();
  const { ticket } = route.params;

  const [activeTab, setActiveTab] = useState<DetailTab>('record');
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: activeTab !== 'diary',
    });
  }, [activeTab, navigation]);

  const handleChangeTab = (tab: DetailTab) => {
    Keyboard.dismiss();
    setActiveTab(tab);
  };

  const handleDeleteTicket = () => {
    setIsDeleteDialogVisible(false);
    navigation.popTo('TicketList', { deletedTicketId: ticket.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="직관 기록"
        onPressBack={() => navigation.goBack()}
        right={
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            onPress={() => setIsDeleteDialogVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="직관 기록 삭제"
          >
            <Trash2 size={20} color={colors.textSecondary} strokeWidth={2.2} />
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
        <TicketRecordPage ticket={ticket} />
      </View>

      <View style={[styles.page, activeTab !== 'diary' && styles.hidden]}>
        <TicketDiaryPage />
      </View>

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
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
});
