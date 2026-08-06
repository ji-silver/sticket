import { Alert } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import {
  type DiaryPhoto,
  type EditorSize,
  translate3,
} from './photoTransform.ts';

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
): Promise<DiaryPhoto | null> {
  if (editorSize.width <= 0 || editorSize.height <= 0) {
    Alert.alert(
      '사진을 추가할 수 없습니다',
      '다이어리 화면을 다시 열어주세요.',
    );

    return null;
  }

  try {
    const image = await ImagePicker.openPicker({
      mediaType: 'photo',
      cropping: true,
      freeStyleCropEnabled: true,
      includeBase64: true,
      compressImageMaxWidth: 4096,
      compressImageMaxHeight: 4096,
      compressImageQuality: 1,
      forceJpg: true,
      cropperToolbarTitle: '사진 편집',
      cropperCancelText: '취소',
      cropperChooseText: '선택',
    });
    if (!image.data) {
      throw new Error('선택한 사진 데이터를 불러올 수 없습니다.');
    }
    const maximumPhotoWidth = editorSize.width * 0.5;
    const maximumPhotoHeight = editorSize.height * 0.5;
    const initialRatio = Math.min(
      maximumPhotoWidth / image.width,
      maximumPhotoHeight / image.height,
      1,
    );
    const photoWidth = image.width * initialRatio;
    const photoHeight = image.height * initialRatio;
    const initialX = (editorSize.width - photoWidth) / 2;
    const initialY = (editorSize.height - photoHeight) / 2;

    return {
      id: Date.now().toString(),
      uri: image.path,
      base64: image.data,
      storagePath: null,
      width: photoWidth,
      height: photoHeight,
      matrix: translate3(initialX, initialY),
    };
  } catch (error) {
    const errorCode = getPickerErrorCode(error);

    if (errorCode === 'E_PICKER_CANCELLED') {
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
