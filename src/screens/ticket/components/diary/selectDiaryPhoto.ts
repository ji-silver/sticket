import { Alert, Linking } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import {
  type DiaryPhoto,
  type EditorSize,
  getInitialPhotoSize,
  translate3,
} from './photoTransform.ts';

export type DiaryPhotoSource = 'camera' | 'library';

const IMAGE_SELECTION_OPTIONS = {
  mediaType: 'photo' as const,
};

const CROPPER_OPTIONS = {
  mediaType: 'photo' as const,
  freeStyleCropEnabled: true,
  includeBase64: true,
  compressImageMaxWidth: 1600,
  compressImageMaxHeight: 1600,
  compressImageQuality: 0.82,
  forceJpg: true,
  cropperToolbarTitle: '사진 편집',
  cropperCancelText: '취소',
  cropperChooseText: '선택',
};

function getPickerErrorCode(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return null;
}

export async function selectDiaryPhoto(
  editorSize: EditorSize,
  source: DiaryPhotoSource,
): Promise<DiaryPhoto | null> {
  if (editorSize.width <= 0 || editorSize.height <= 0) {
    Alert.alert(
      '사진을 추가할 수 없습니다',
      '다이어리 화면을 다시 열어주세요.',
    );

    return null;
  }

  try {
    const selectedImage =
      source === 'camera'
        ? await ImagePicker.openCamera(IMAGE_SELECTION_OPTIONS)
        : await ImagePicker.openPicker(IMAGE_SELECTION_OPTIONS);

    const image = await ImagePicker.openCropper({
      path: selectedImage.path,
      width: selectedImage.width,
      height: selectedImage.height,
      ...CROPPER_OPTIONS,
    });

    if (!image.data) {
      throw new Error('선택한 사진 데이터를 불러올 수 없습니다.');
    }
    const initialSize = getInitialPhotoSize(
      { width: image.width, height: image.height },
      editorSize,
    );
    const photoWidth = initialSize.width;
    const photoHeight = initialSize.height;
    const initialX = (editorSize.width - photoWidth) / 2;
    const initialY = (editorSize.height - photoHeight) / 2;

    return {
      id: Date.now().toString(),
      uri: image.path,
      base64: image.data,
      storagePath: null,
      width: photoWidth,
      height: photoHeight,
      sourceWidth: image.width,
      sourceHeight: image.height,
      matrix: translate3(initialX, initialY),
    };
  } catch (error) {
    const errorCode = getPickerErrorCode(error);

    if (errorCode === 'E_PICKER_CANCELLED') {
      return null;
    }

    if (errorCode === 'E_NO_CAMERA_PERMISSION') {
      Alert.alert(
        '카메라 권한이 필요해요',
        '기기 설정에서 카메라 접근을 허용해 주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정 열기', onPress: () => Linking.openSettings() },
        ],
      );

      return null;
    }

    if (errorCode === 'E_PICKER_CANNOT_RUN_CAMERA_ON_SIMULATOR') {
      Alert.alert(
        '카메라를 실행할 수 없어요',
        '카메라 촬영은 실제 기기에서 확인해 주세요.',
      );

      return null;
    }

    if (errorCode === 'E_NO_LIBRARY_PERMISSION') {
      Alert.alert(
        '사진 접근 권한이 필요합니다',
        '기기 설정에서 사진 접근 권한을 허용해주세요.',
      );

      return null;
    }

    console.error('사진을 선택하지 못했습니다.', error);
    Alert.alert('사진을 불러오지 못했습니다', '잠시 후 다시 시도해주세요.');

    return null;
  }
}
