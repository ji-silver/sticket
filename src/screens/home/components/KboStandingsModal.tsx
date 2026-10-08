import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import AppText from '../../../components/common/AppText';
import AppButton from '../../../components/common/AppButton';
import AppSkeleton from '../../../components/common/AppSkeleton';
import { useGetKboStandings } from '../../../features/standings/api/useGetKboStandings';
import { getTodayInKorea } from '../../../lib/date';
import { colors } from '../../../styles/colors';
import { fonts } from '../../../styles/fonts';
import type { KboStanding } from '../../../features/standings/types';

interface KboStandingsModalProps {
  visible: boolean;
  favoriteTeamId: string | null | undefined;
  onClose: () => void;
}

export default function KboStandingsModal({
  visible,
  favoriteTeamId,
  onClose,
}: KboStandingsModalProps) {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const season = Number(getTodayInKorea().slice(0, 4));
  const { data, isPending, isError, isFetching, refetch } = useGetKboStandings(
    season,
    visible,
  );

  if (!visible) return null;

  // 작은 화면·큰 글자에서는 바깥 여백보다 표의 가독성을 우선해 전체 화면으로 넓힌다.
  const fullScreen = width < 360 || height < 650 || fontScale > 1.25;
  const dialogWidth = fullScreen ? width : Math.min(width - 32, 560);
  const availableHeight = height - insets.top - insets.bottom;
  const tableWidth = Math.max(dialogWidth - 40, 296 * fontScale);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.root,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
          fullScreen && styles.fullScreenRoot,
        ]}
      >
        {!fullScreen ? (
          <Pressable
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="KBO 순위 창 바깥 영역 닫기"
          />
        ) : null}
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            {
              width: dialogWidth,
              maxHeight: fullScreen
                ? availableHeight
                : Math.min(availableHeight - 32, height * 0.86),
            },
            fullScreen && styles.fullScreenDialog,
          ]}
        >
          <View style={styles.header}>
            <View style={styles.heading}>
              <AppText
                style={[styles.title, { fontSize: 21 * fontScale }]}
                accessibilityRole="header"
              >
                KBO 순위
              </AppText>
              <AppText style={[styles.caption, { fontSize: 13 * fontScale }]}>
                {season} 정규시즌
              </AppText>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="KBO 순위 닫기"
            >
              <X size={22} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator
          >
            {data ? (
              <>
                {isError ? (
                  <AppText
                    style={[styles.warning, { fontSize: 13 * fontScale }]}
                    accessibilityRole="alert"
                  >
                    최신 순위를 불러오지 못했어요. 이전 순위를 표시하고 있어요.
                  </AppText>
                ) : null}
                {/* AppText의 앱 기본값은 글자 확대를 끈다. 이 표는 글자와 열 너비를 함께 확대한다. */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator
                  contentContainerStyle={styles.tableScrollContent}
                >
                  <View style={{ width: tableWidth }}>
                    <StandingRow scale={fontScale} />
                    {data.standings.map(row => (
                      <StandingRow
                        key={row.teamId}
                        row={row}
                        scale={fontScale}
                        favorite={row.teamId === favoriteTeamId}
                      />
                    ))}
                  </View>
                </ScrollView>
              </>
            ) : isPending ? (
              <View
                accessibilityRole="progressbar"
                accessible
                accessibilityLabel="KBO 순위를 불러오는 중"
                style={styles.loading}
              >
                {[0, 1, 2, 3, 4].map(index => (
                  <AppSkeleton
                    key={index}
                    width="100%"
                    height={32}
                    borderRadius={4}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.messageContainer}>
                <AppText
                  style={[styles.message, { fontSize: 15 * fontScale }]}
                  accessibilityRole={isError ? 'alert' : undefined}
                >
                  {isError
                    ? '순위를 불러오지 못했어요'
                    : '아직 순위가 집계되지 않았어요'}
                </AppText>
                <AppText style={[styles.caption, { fontSize: 13 * fontScale }]}>
                  {isError
                    ? '잠시 후 다시 시도해 주세요.'
                    : '공식 순위가 수집되면 여기에 표시돼요.'}
                </AppText>
                {isError ? (
                  <AppButton
                    onPress={() => refetch()}
                    disabled={isFetching}
                    accessibilityLabel="KBO 순위 다시 시도"
                    style={styles.retryButton}
                  >
                    <AppText
                      style={[styles.actionText, { fontSize: 14 * fontScale }]}
                    >
                      다시 시도
                    </AppText>
                  </AppButton>
                ) : null}
              </View>
            )}
          </ScrollView>

          {data ? (
            <View style={styles.footer}>
              <Pressable
                onPress={() => refetch()}
                disabled={isFetching}
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="KBO 순위 새로고침"
                accessibilityState={{ disabled: isFetching, busy: isFetching }}
              >
                <AppText
                  style={[styles.refreshText, { fontSize: 12 * fontScale }]}
                >
                  {isFetching ? '불러오는 중…' : '새로고침'}
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function StandingRow({
  row,
  scale,
  favorite = false,
}: {
  row?: KboStanding;
  scale: number;
  favorite?: boolean;
}) {
  const values = row
    ? [
        row.rank,
        row.teamName,
        row.wins,
        row.losses,
        row.draws,
        row.winRate === null ? '집계 전' : row.winRate.toFixed(3),
        row.gamesBehind ?? '-',
      ]
    : ['순위', '구단', '승', '패', '무', '승률', '게임차'];
  const columnWidths = [32, 0, 30, 30, 26, 54, 44];
  const label = row
    ? `${row.teamName}${favorite ? ', 응원 구단' : ''}, ${row.rank}위, ${
        row.wins
      }승 ${row.losses}패 ${row.draws}무, 승률 ${values[5]}, 게임차 ${
        values[6]
      }`
    : '순위, 구단, 승, 패, 무, 승률, 게임차';

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        styles.row,
        !row && styles.tableHeader,
        favorite && styles.favoriteRow,
        { minHeight: (row ? 44 : 34) * scale },
      ]}
    >
      {values.map((value, index) => (
        <AppText
          key={index}
          style={[
            styles.cell,
            {
              fontSize: (row ? 14 : 12) * scale,
              width: columnWidths[index] * scale,
            },
            index === 1 && styles.teamCell,
            index === 0 && styles.rankCell,
            !row && styles.columnLabel,
            favorite && (index === 1 || index === 0) && styles.favoriteText,
          ]}
        >
          {value}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.32)' },
  fullScreenRoot: { backgroundColor: colors.surface },
  dialog: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  fullScreenDialog: { flex: 1, borderRadius: 0 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  heading: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontFamily: fonts.bold },
  caption: { color: colors.textSecondary, marginTop: 6 },
  closeButton: {
    width: 44,
    height: 44,
    marginTop: -8,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.55 },
  body: { flexGrow: 0, flexShrink: 1 },
  bodyContent: { paddingBottom: 4 },
  tableScrollContent: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tableHeader: { borderBottomWidth: 1 },
  cell: {
    color: colors.text,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  rankCell: { textAlign: 'left' },
  teamCell: { flex: 1, minWidth: 44, textAlign: 'left' },
  columnLabel: { color: colors.textSecondary },
  favoriteRow: { backgroundColor: colors.primary50 },
  favoriteText: { color: colors.primary, fontFamily: fonts.bold },
  loading: { gap: 12, paddingVertical: 8 },
  warning: { color: colors.textSecondary, marginBottom: 12 },
  messageContainer: { paddingVertical: 24 },
  message: { color: colors.text, fontFamily: fonts.bold },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 12,
    marginTop: 12,
    justifyContent: 'center',
    backgroundColor: colors.primary50,
  },
  actionText: { color: colors.primary, fontFamily: fonts.bold },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4,
  },
  refreshButton: { minHeight: 44, justifyContent: 'center' },
  refreshText: { color: colors.textSecondary },
});
