import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ChevronRight, Ticket } from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker';
import AppBottomSheet from '../../../components/common/AppBottomSheet.tsx';
import AppText from '../../../components/common/AppText.tsx';
import InlineActionButton from '../../../components/common/InlineActionButton.tsx';
import { colors } from '../../../styles/colors.ts';
import { fonts } from '../../../styles/fonts.ts';

interface OriginalTicketImageFieldProps {
  value: string | null;
  onChange: (uri: string | null) => void;
}

type ImageSource = 'camera' | 'library';

const IMAGE_SELECTION_OPTIONS = {
  mediaType: 'photo' as const,
};

const CROPPER_OPTIONS = {
  mediaType: 'photo' as const,
  freeStyleCropEnabled: true,
  compressImageMaxWidth: 2400,
  compressImageMaxHeight: 2400,
  compressImageQuality: 0.9,
  cropperToolbarTitle: '티켓 앞면 맞추기',
  cropperCancelText: '취소',
  cropperChooseText: '사용',
};

function OriginalTicketImageField({
  value,
  onChange,
}: OriginalTicketImageFieldProps) {
  const [isSourceSheetVisible, setIsSourceSheetVisible] = useState(false);
  const [previewAspectRatio, setPreviewAspectRatio] = useState(2 / 3);
  const pendingImageSource = useRef<ImageSource | null>(null);

  const openSourceSheet = () => {
    setIsSourceSheetVisible(true);
  };

  const closeSourceSheet = () => {
    setIsSourceSheetVisible(false);
  };

  const requestTicketImage = (source: ImageSource) => {
    pendingImageSource.current = source;
    closeSourceSheet();
  };

  /**
   * 카메라 또는 앨범에서 티켓 앞면 한 장을 가져옵니다.
   * 세로형 지류 티켓과 모바일 티켓을 모두 지원하기 위해 고정 비율을 사용하지 않습니다.
   */
  const selectTicketImage = async (source: ImageSource) => {
    try {
      const selectedImage =
        source === 'camera'
          ? await ImagePicker.openCamera(IMAGE_SELECTION_OPTIONS)
          : await ImagePicker.openPicker(IMAGE_SELECTION_OPTIONS);

      // iOS 크롭 화면의 기본값이 200×200이므로 원본 비율로 시작하도록
      // 선택한 사진의 실제 크기를 전달합니다.
      const image = await ImagePicker.openCropper({
        path: selectedImage.path,
        width: selectedImage.width,
        height: selectedImage.height,
        ...CROPPER_OPTIONS,
      });

      setPreviewAspectRatio(image.width / image.height);
      onChange(image.path);
    } catch (error) {
      const errorCode = (error as { code?: string } | null)?.code;

      if (errorCode === 'E_PICKER_CANCELLED') {
        return;
      }

      if (
        errorCode === 'E_NO_CAMERA_PERMISSION' ||
        errorCode === 'E_NO_LIBRARY_PERMISSION'
      ) {
        const permissionName =
          errorCode === 'E_NO_CAMERA_PERMISSION' ? '카메라' : '사진';

        Alert.alert(
          `${permissionName} 권한이 필요해요`,
          `기기 설정에서 ${permissionName} 접근을 허용해 주세요.`,
          [
            { text: '취소', style: 'cancel' },
            {
              text: '설정 열기',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ],
        );

        return;
      }

      if (errorCode === 'E_PICKER_CANNOT_RUN_CAMERA_ON_SIMULATOR') {
        Alert.alert(
          '카메라를 실행할 수 없어요',
          '카메라 촬영은 실제 기기에서 확인해 주세요.',
        );

        return;
      }

      console.error('원본 티켓 이미지를 불러오지 못했습니다.', error);
      Alert.alert('사진을 불러오지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  };

  const handleSourceSheetDismiss = () => {
    const source = pendingImageSource.current;
    pendingImageSource.current = null;

    if (source) {
      selectTicketImage(source);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleGroup}>
          <AppText style={styles.sectionTitle}>원본 티켓</AppText>
          {value ? (
            <InlineActionButton
              label="변경"
              tone="primary"
              onPress={openSourceSheet}
              accessibilityLabel="원본 티켓 사진 변경"
            />
          ) : (
            <AppText style={styles.optionalLabel}>선택</AppText>
          )}
        </View>
      </View>

      {value ? (
        <Image
          source={{ uri: value }}
          style={[styles.previewImage, { aspectRatio: previewAspectRatio }]}
          resizeMode="contain"
          accessibilityLabel="선택한 원본 티켓 미리보기"
        />
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.uploadCard,
            pressed && styles.uploadCardPressed,
          ]}
          onPress={openSourceSheet}
          accessibilityRole="button"
          accessibilityLabel="원본 티켓 사진 추가"
          accessibilityHint="카메라 촬영 또는 앨범 선택 방법을 엽니다"
        >
          <View style={styles.uploadIcon}>
            <Ticket size={22} color={colors.primary} strokeWidth={2} />
          </View>

          <AppText style={styles.uploadTitle}>사진 추가</AppText>

          <ChevronRight
            size={20}
            color={colors.textPlaceholder}
            strokeWidth={2}
          />
        </Pressable>
      )}

      <AppBottomSheet
        visible={isSourceSheetVisible}
        title="티켓 사진 추가"
        description="티켓 앞면이 잘 보이는 사진을 선택해 주세요"
        onClose={closeSourceSheet}
        onClosed={handleSourceSheetDismiss}
        closeAccessibilityLabel="원본 티켓 추가 닫기"
      >
        <View style={styles.sourceList}>
          <SourceRow
            title="사진 촬영"
            onPress={() => requestTicketImage('camera')}
          />

          <View style={styles.divider} />

          <SourceRow
            title="앨범에서 선택"
            onPress={() => requestTicketImage('library')}
          />

          {value && (
            <>
              <View style={styles.divider} />

              <SourceRow
                title="사진 삭제"
                tone="destructive"
                onPress={() => {
                  setPreviewAspectRatio(2 / 3);
                  onChange(null);
                  closeSourceSheet();
                }}
              />
            </>
          )}
        </View>
      </AppBottomSheet>
    </View>
  );
}

export default OriginalTicketImageField;

interface SourceRowProps {
  title: string;
  tone?: 'default' | 'destructive';
  onPress: () => void;
}

function SourceRow({ title, tone = 'default', onPress }: SourceRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.sourceRow,
        pressed && styles.sourceRowPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <AppText
        style={[
          styles.sourceTitle,
          tone === 'destructive' && styles.destructiveSourceTitle,
        ]}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    height: 44,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  optionalLabel: {
    marginLeft: 8,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  uploadCard: {
    height: 82,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  uploadCardPressed: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  previewImage: {
    height: 82,
    maxWidth: 120,
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: colors.background,
  },
  sourceList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sourceRow: {
    height: 58,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  sourceRowPressed: {
    backgroundColor: colors.background,
  },
  sourceTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  destructiveSourceTitle: {
    color: '#D92D20',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
