import { Alert } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';

import { selectDiaryPhoto } from './selectDiaryPhoto.ts';

jest.mock('react-native-image-crop-picker', () => ({
  openCamera: jest.fn(),
  openCropper: jest.fn(),
  openPicker: jest.fn(),
}));

const editorSize = { width: 300, height: 400 };
const originalImage = {
  path: 'file:///original.jpg',
  width: 1200,
  height: 800,
};
const editedImage = {
  path: 'file:///photo.jpg',
  data: 'photo-base64',
  width: 900,
  height: 700,
};

describe('다이어리 사진 추가', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('카메라 사진을 원본 비율로 편집한 뒤 다이어리에 추가한다', async () => {
    (ImagePicker.openCamera as jest.Mock).mockResolvedValue(originalImage);
    (ImagePicker.openCropper as jest.Mock).mockResolvedValue(editedImage);

    const photo = await selectDiaryPhoto(editorSize, 'camera');

    expect(ImagePicker.openCamera).toHaveBeenCalledWith({
      mediaType: 'photo',
    });
    expect(ImagePicker.openCropper).toHaveBeenCalledWith(
      expect.objectContaining({
        path: originalImage.path,
        width: originalImage.width,
        height: originalImage.height,
        freeStyleCropEnabled: true,
        includeBase64: true,
      }),
    );
    expect(ImagePicker.openPicker).not.toHaveBeenCalled();
    expect(photo).toMatchObject({
      uri: editedImage.path,
      base64: editedImage.data,
      sourceWidth: editedImage.width,
      sourceHeight: editedImage.height,
    });
  });

  it('앨범에서 선택한 사진도 기존과 같은 형태로 반환한다', async () => {
    (ImagePicker.openPicker as jest.Mock).mockResolvedValue(originalImage);
    (ImagePicker.openCropper as jest.Mock).mockResolvedValue(editedImage);

    const photo = await selectDiaryPhoto(editorSize, 'library');

    expect(ImagePicker.openPicker).toHaveBeenCalled();
    expect(ImagePicker.openCamera).not.toHaveBeenCalled();
    expect(photo?.uri).toBe(editedImage.path);
  });

  it('사진 편집을 취소하면 사진을 추가하지 않는다', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    (ImagePicker.openCamera as jest.Mock).mockResolvedValue(originalImage);
    (ImagePicker.openCropper as jest.Mock).mockRejectedValue({
      code: 'E_PICKER_CANCELLED',
    });

    await expect(selectDiaryPhoto(editorSize, 'camera')).resolves.toBeNull();
    expect(alert).not.toHaveBeenCalled();
  });

  it('카메라 권한이 없으면 설정 안내를 표시한다', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    (ImagePicker.openCamera as jest.Mock).mockRejectedValue({
      code: 'E_NO_CAMERA_PERMISSION',
    });

    await expect(selectDiaryPhoto(editorSize, 'camera')).resolves.toBeNull();
    expect(alert).toHaveBeenCalledWith(
      '카메라 권한이 필요해요',
      '기기 설정에서 카메라 접근을 허용해 주세요.',
      expect.any(Array),
    );
  });
});
