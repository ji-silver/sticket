import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/core';
import DiaryCover from '../../components/DiaryCover.tsx';
import { useState } from 'react';
import { ChevronRight, ImagePlus, Plus } from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { fonts } from '../../styles/fonts.ts';
import AppButton from '../../components/common/AppButton.tsx';
import AppText from '../../components/common/AppText.tsx';
import FilterChip from '../../components/common/FilterChip.tsx';
import { colors } from '../../styles/colors.ts';
import ScreenHeader from '../../components/common/ScreenHeader.tsx';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/RootStackNavigator.tsx';
import { useCreateTicketBook } from '../../features/ticket-book/api/useCreateTicketBook.ts';
import { useUpdateTicketBook } from '../../features/ticket-book/api/useUpdateTicketBook.ts';
import type { TicketBookSport } from '../../features/ticket-book/types.ts';

// 서버에서 생성이 지원되는 종목만 선택지로 제공한다.
const SPORT_OPTIONS: { id: TicketBookSport; label: string }[] = [
  { id: 'baseball', label: '야구' },
];

type CoverColorType = 'solid' | 'stripe';

interface CoverColorOption {
  id: string;
  label: string;
  color: string;
  type: CoverColorType;
}

interface SelectedCoverPhoto {
  uri: string;
  base64?: string;
}

const COVER_COLORS: CoverColorOption[] = [
  {
    id: 'kiwoom-wine',
    label: '로즈',
    type: 'solid',
    color: '#DF9EAF',
  },
  {
    id: 'white-black-stripe',
    label: '흰색 스트라이프',
    type: 'stripe',
    color: '#F8F8F8',
  },
  {
    id: 'giants-orange',
    label: '오렌지',
    type: 'solid',
    color: '#F4A06E',
  },
  {
    id: 'lions-blue',
    label: '하늘색',
    type: 'solid',
    color: '#8DB7E4',
  },
  {
    id: 'dinos-blue',
    label: '블루그레이',
    type: 'solid',
    color: '#9EB2D0',
  },
  {
    id: 'soft-black',
    label: '그레이',
    type: 'solid',
    color: '#9B9B9B',
  },
  {
    id: 'navy',
    label: '슬레이트 블루',
    type: 'solid',
    color: '#96A8C2',
  },
  {
    id: 'tigers-red',
    label: '핑크',
    type: 'solid',
    color: '#EC8F9F',
  },
  {
    id: 'eagles-navy',
    label: '라벤더',
    type: 'solid',
    color: '#9D9AC4',
  },
  {
    id: 'twins-burgundy',
    label: '버건디',
    type: 'solid',
    color: '#BE8D9D',
  },
];

const PREVIEW_SIZE = 178;

function AddDiaryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'AddDiary'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddDiary'>>();
  const ticketBook = route.params?.ticketBook;
  const isEditing = ticketBook !== undefined;

  const [selectedSport, setSelectedSport] =
    useState<TicketBookSport>('baseball');

  const [selectedCoverColorId, setSelectedCoverColorId] = useState(
    COVER_COLORS.find(
      option =>
        option.color === ticketBook?.coverColor &&
        option.type === ticketBook.coverPattern,
    )?.id ?? COVER_COLORS[0].id,
  );
  const [coverPhoto, setCoverPhoto] = useState<SelectedCoverPhoto | null>(
    ticketBook?.photoUri ? { uri: ticketBook.photoUri } : null,
  );

  // 생성은 야구만 지원하며 다른 종목의 기존 데이터를 야구 규칙으로 수정하지 않는다.
  const isSupportedSport = !ticketBook || ticketBook.sport === 'baseball';
  const selectedCoverColor =
    COVER_COLORS.find(color => color.id === selectedCoverColorId) ??
    COVER_COLORS[0];

  const handlePressSelectPhoto = async () => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        width: 620,
        height: 920,
        compressImageQuality: 0.9,
        includeBase64: true,
        forceJpg: true,
        cropperToolbarTitle: '사진 편집',
        cropperCancelText: '취소',
        cropperChooseText: '선택',
      });

      if (!image.data) {
        throw new Error('선택한 이미지 데이터를 읽지 못했습니다.');
      }

      setCoverPhoto({
        uri: image.path,
        base64: image.data,
      });
    } catch (error) {
      const isCancelled =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'E_PICKER_CANCELLED';

      if (!isCancelled) {
        console.error('사진을 선택하지 못했습니다.', error);
        Alert.alert('사진을 불러오지 못했어요', '잠시 후 다시 시도해 주세요.');
      }
    }
  };

  const createTicketBookMutation = useCreateTicketBook();
  const updateTicketBookMutation = useUpdateTicketBook();
  const isSavingTicketBook =
    createTicketBookMutation.isPending || updateTicketBookMutation.isPending;

  const handleSaveTicketBook = async () => {
    if (!isSupportedSport || isSavingTicketBook) {
      return;
    }

    try {
      if (ticketBook) {
        await updateTicketBookMutation.mutateAsync({
          ticketBookId: ticketBook.id,
          coverColor: selectedCoverColor.color,
          coverPattern: selectedCoverColor.type,
          // 기존 사진을 건드리지 않으면 유지하고, 제거한 경우에만 null을 보낸다.
          coverImageBase64:
            coverPhoto?.base64 ??
            (ticketBook.photoUri && !coverPhoto ? null : undefined),
        });
      } else {
        await createTicketBookMutation.mutateAsync({
          sport: selectedSport,
          coverColor: selectedCoverColor.color,
          coverPattern: selectedCoverColor.type,
          coverImageBase64: coverPhoto?.base64,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error(
        `티켓북을 ${isEditing ? '수정' : '생성'}하지 못했습니다.`,
        error,
      );

      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : null;

      if (errorCode === '23505') {
        Alert.alert(
          '이미 야구 티켓북이 있어요',
          '기존 티켓북을 이용해 주세요.',
        );
      } else {
        Alert.alert(
          `티켓북을 ${isEditing ? '수정' : '만들지'} 못했어요`,
          '잠시 후 다시 시도해 주세요.',
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title={isEditing ? '티켓북 수정' : '새 티켓북'}
        onPressBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isSupportedSport && (
          <View style={styles.sportSection}>
            <AppText style={styles.sectionTitle}>종목</AppText>
            <View style={styles.sportOptions}>
              {SPORT_OPTIONS.map(sport => (
                <FilterChip
                  key={sport.id}
                  label={sport.label}
                  selected={selectedSport === sport.id}
                  onPress={() => setSelectedSport(sport.id)}
                />
              ))}
            </View>
          </View>
        )}
        {isSupportedSport ? (
          <>
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>표지</AppText>
              </View>

              <View style={styles.previewSection}>
                <View>
                  <DiaryCover
                    size={PREVIEW_SIZE}
                    coverColor={selectedCoverColor.color}
                    coverPattern={selectedCoverColor.type}
                    photoUri={coverPhoto?.uri}
                  />
                  <Pressable
                    style={styles.previewPhotoButton}
                    onPress={handlePressSelectPhoto}
                    disabled={isSavingTicketBook}
                    accessibilityRole="button"
                    accessibilityLabel={`포토카드 사진 ${
                      coverPhoto ? '변경' : '추가'
                    }`}
                    accessibilityState={{ disabled: isSavingTicketBook }}
                  >
                    {!coverPhoto && (
                      <Plus size={18} color={colors.textSecondary} />
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.colorGrid}>
                {COVER_COLORS.map(colorOption => {
                  const isSelected = selectedCoverColorId === colorOption.id;

                  return (
                    <View key={colorOption.id} style={styles.colorCell}>
                      <Pressable
                        style={[
                          styles.colorSwatchButton,
                          isSelected && styles.colorSwatchButtonSelected,
                        ]}
                        onPress={() => setSelectedCoverColorId(colorOption.id)}
                        disabled={isSavingTicketBook}
                        accessibilityRole="button"
                        accessibilityLabel={`${colorOption.label} 표지`}
                        accessibilityState={{
                          selected: isSelected,
                          disabled: isSavingTicketBook,
                        }}
                      >
                        <View
                          style={[
                            styles.colorSwatch,
                            { backgroundColor: colorOption.color },
                          ]}
                        >
                          {colorOption.type === 'stripe' && (
                            <>
                              {[3, 8, 13, 18, 23, 28].map(left => (
                                <View
                                  key={`stripe-${left}`}
                                  style={[styles.stripeLine, { left }]}
                                />
                              ))}
                            </>
                          )}
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>포토카드</AppText>
                <AppText style={styles.photoCardOptionalText}>선택사항</AppText>
              </View>

              <View style={styles.photoCardRow}>
                <Pressable
                  onPress={handlePressSelectPhoto}
                  style={styles.photoCardButton}
                  disabled={isSavingTicketBook}
                  accessibilityRole="button"
                  accessibilityLabel={coverPhoto ? '사진 변경' : '사진 추가'}
                  accessibilityState={{ disabled: isSavingTicketBook }}
                >
                  <ImagePlus size={20} color={colors.textSecondary} />
                  <AppText style={styles.photoCardText}>
                    {coverPhoto ? '사진 변경' : '사진 추가'}
                  </AppText>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </Pressable>
                {coverPhoto && (
                  <Pressable
                    onPress={() => setCoverPhoto(null)}
                    style={styles.removePhotoButton}
                    disabled={isSavingTicketBook}
                    accessibilityRole="button"
                    accessibilityLabel="사진 제거"
                    accessibilityState={{ disabled: isSavingTicketBook }}
                  >
                    <AppText style={styles.removePhotoText}>제거</AppText>
                  </Pressable>
                )}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.formSection}>
            <AppText style={styles.readySoonTitle}>
              이 종목의 티켓북은 아직 수정할 수 없어요
            </AppText>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          style={[
            styles.createButton,
            !isSupportedSport && styles.createButtonDisabled,
          ]}
          disabled={!isSupportedSport || isSavingTicketBook}
          isLoading={isSavingTicketBook}
          onPress={handleSaveTicketBook}
          accessibilityRole="button"
          accessibilityLabel={
            isSavingTicketBook
              ? '저장 중'
              : isEditing
              ? '수정하기'
              : '티켓북 만들기'
          }
          accessibilityState={{
            disabled: !isSupportedSport || isSavingTicketBook,
          }}
        >
          <AppText
            style={[
              styles.createButtonText,
              !isSupportedSport && styles.createButtonTextDisabled,
            ]}
          >
            {isEditing ? '수정하기' : '티켓북 만들기'}
          </AppText>
        </AppButton>
      </View>
    </SafeAreaView>
  );
}

export default AddDiaryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  previewSection: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  previewPhotoButton: {
    // DiaryCover의 포토카드 슬롯 위치와 크기에 맞춰 사진 추가 진입점을 겹친다.
    position: 'absolute',
    left: PREVIEW_SIZE * 0.398,
    top: PREVIEW_SIZE * 0.584,
    width: PREVIEW_SIZE * 0.256,
    height: PREVIEW_SIZE * 0.38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportSection: {
    minHeight: 52,
    paddingTop: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  sportOptions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },

  formSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  colorCell: {
    width: '20%',
    alignItems: 'center',
  },
  colorSwatchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchButtonSelected: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stripeLine: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: 30,
    backgroundColor: colors.text,
  },

  photoCardRow: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCardButton: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoCardText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  photoCardOptionalText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  removePhotoButton: {
    minHeight: 52,
    paddingLeft: 20,
    paddingRight: 4,
    justifyContent: 'center',
  },
  removePhotoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  readySoonTitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  createButton: {
    height: 54,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  createButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
