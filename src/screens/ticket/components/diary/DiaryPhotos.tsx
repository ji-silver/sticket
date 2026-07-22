import { Alert, StyleSheet } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useRotationGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MINIMUM_PHOTO_SCALE = 0.25;
const MAXIMUM_PHOTO_SCALE = 4;

export interface EditorSize {
  width: number;
  height: number;
}

export type Matrix3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface DiaryPhoto {
  id: string;
  uri: string;
  width: number;
  height: number;
  matrix: Matrix3;
}

interface DiaryPhotosProps {
  photos: DiaryPhoto[];
  editorSize: EditorSize;
  selectedPhotoId: string | null;
  onSelectPhoto: (photoId: string) => void;
  onChangePhoto: (photo: DiaryPhoto) => void;
}

interface DiaryPhotoItemProps {
  photo: DiaryPhoto;
  index: number;
  editorSize: EditorSize;
  isSelected: boolean;
  onSelectPhoto: (photoId: string) => void;
  onChangePhoto: (photo: DiaryPhoto) => void;
}

interface Point {
  x: number;
  y: number;
}

function clamp(value: number, minimum: number, maximum: number) {
  'worklet';

  return Math.min(maximum, Math.max(minimum, value));
}

function identity3(): Matrix3 {
  'worklet';

  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

function multiply3(first: Matrix3, second: Matrix3): Matrix3 {
  'worklet';

  return [
    first[0] * second[0] + first[3] * second[1] + first[6] * second[2],

    first[1] * second[0] + first[4] * second[1] + first[7] * second[2],

    first[2] * second[0] + first[5] * second[1] + first[8] * second[2],

    first[0] * second[3] + first[3] * second[4] + first[6] * second[5],

    first[1] * second[3] + first[4] * second[4] + first[7] * second[5],

    first[2] * second[3] + first[5] * second[4] + first[8] * second[5],

    first[0] * second[6] + first[3] * second[7] + first[6] * second[8],

    first[1] * second[6] + first[4] * second[7] + first[7] * second[8],

    first[2] * second[6] + first[5] * second[7] + first[8] * second[8],
  ];
}

function translate3(x: number, y: number): Matrix3 {
  'worklet';

  return [1, 0, 0, 0, 1, 0, x, y, 1];
}

function scale3(x: number, y: number): Matrix3 {
  'worklet';

  return [x, 0, 0, 0, y, 0, 0, 0, 1];
}

function rotate3(radians: number): Matrix3 {
  'worklet';

  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);

  return [cosine, sine, 0, -sine, cosine, 0, 0, 0, 1];
}

function applyTransformations(
  translation: Point,
  scaleValue: number,
  rotationValue: number,
  origin: Point,
  savedTransform: Matrix3,
): Matrix3 {
  'worklet';

  let matrix = identity3();

  matrix = multiply3(matrix, translate3(translation.x, translation.y));

  matrix = multiply3(matrix, translate3(origin.x, origin.y));

  matrix = multiply3(matrix, scale3(scaleValue, scaleValue));

  matrix = multiply3(matrix, translate3(-origin.x, -origin.y));

  matrix = multiply3(matrix, translate3(origin.x, origin.y));

  matrix = multiply3(matrix, rotate3(rotationValue));

  matrix = multiply3(matrix, translate3(-origin.x, -origin.y));

  return multiply3(savedTransform, matrix);
}

function constrainPhotoPosition(
  matrix: Matrix3,
  photoWidth: number,
  photoHeight: number,
  editorSize: EditorSize,
): Matrix3 {
  'worklet';

  if (editorSize.width <= 0 || editorSize.height <= 0) {
    return matrix;
  }

  const currentScale = Math.max(Math.hypot(matrix[0], matrix[1]), 0.0001);
  const rotation = Math.atan2(matrix[1], matrix[0]);
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);

  const rotatedWidth =
    Math.abs(cosine) * photoWidth + Math.abs(sine) * photoHeight;
  const rotatedHeight =
    Math.abs(sine) * photoWidth + Math.abs(cosine) * photoHeight;

  const maximumScaleThatFits = Math.min(
    editorSize.width / rotatedWidth,
    editorSize.height / rotatedHeight,
    MAXIMUM_PHOTO_SCALE,
  );
  const constrainedScale = Math.min(currentScale, maximumScaleThatFits);

  const boundingWidth = rotatedWidth * constrainedScale;
  const boundingHeight = rotatedHeight * constrainedScale;
  const currentCenterX = matrix[6] + photoWidth / 2;
  const currentCenterY = matrix[7] + photoHeight / 2;
  const constrainedCenterX = clamp(
    currentCenterX,
    boundingWidth / 2,
    editorSize.width - boundingWidth / 2,
  );
  const constrainedCenterY = clamp(
    currentCenterY,
    boundingHeight / 2,
    editorSize.height - boundingHeight / 2,
  );

  return [
    cosine * constrainedScale,
    sine * constrainedScale,
    matrix[2],
    -sine * constrainedScale,
    cosine * constrainedScale,
    matrix[5],
    constrainedCenterX - photoWidth / 2,
    constrainedCenterY - photoHeight / 2,
    matrix[8],
  ];
}

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
  // 크기가 0이면 x
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
      cropping: true, // 크롭 사용
      freeStyleCropEnabled: true, // 자유 크롭
      width: 2048,
      height: 2048,
      compressImageQuality: 0.9,
      cropperToolbarTitle: '사진 편집',
      cropperCancelText: '취소',
      cropperChooseText: '선택',
    });

    // 처음 표시할 최대 크기 (50%넘지 않음)
    const maximumPhotoWidth = editorSize.width * 0.5;
    const maximumPhotoHeight = editorSize.height * 0.5;

    const initialRatio = Math.min(
      maximumPhotoWidth / image.width,
      maximumPhotoHeight / image.height,
      1,
    );

    const photoWidth = image.width * initialRatio;
    const photoHeight = image.height * initialRatio;

    // 사진 업로드 시 중앙에 배치 (다이어리 크기에서 사진 크기를 뺀 후 절반으로 나눔)
    const initialX = (editorSize.width - photoWidth) / 2;
    const initialY = (editorSize.height - photoHeight) / 2;

    return {
      id: Date.now().toString(),
      uri: image.path,
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

function DiaryPhotoItem({
  photo,
  index,
  editorSize,
  isSelected,
  onSelectPhoto,
  onChangePhoto,
}: DiaryPhotoItemProps) {

  const matrix = useSharedValue<Matrix3>(photo.matrix);
  const translation = useSharedValue<Point>({
    x: 0,
    y: 0,
  });

  const origin = useSharedValue<Point>({
    x: 0,
    y: 0,
  });

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const isScaling = useSharedValue(false);
  const isRotating = useSharedValue(false);

  const savePhotoMatrix = (nextMatrix: Matrix3) => {
    onChangePhoto({
      ...photo,
      matrix: nextMatrix,
    });
  };

  const commitCurrentTransform = () => {
    'worklet';

    const nextMatrix = applyTransformations(
      translation.value,
      scale.value,
      rotation.value,
      origin.value,
      matrix.value,
    );

    const constrainedMatrix = constrainPhotoPosition(
      nextMatrix,
      photo.width,
      photo.height,
      editorSize,
    );

    matrix.value = constrainedMatrix;

    translation.value = {
      x: 0,
      y: 0,
    };

    scale.value = 1;
    rotation.value = 0;

    scheduleOnRN(savePhotoMatrix, constrainedMatrix);
  };

  const selectGesture = useTapGesture({
    onActivate: () => {
      scheduleOnRN(onSelectPhoto, photo.id);
    },
  });

  const panGesture = usePanGesture({
    enabled: isSelected,
    averageTouches: true,

    onUpdate: event => {
      translation.value = {
        x: translation.value.x + event.changeX,
        y: translation.value.y + event.changeY,
      };
    },

    onDeactivate: commitCurrentTransform,
  });

  const pinchGesture = usePinchGesture({
    enabled: isSelected,
    onActivate: event => {
      if (!isScaling.value && !isRotating.value) {
        origin.value = {
          x: -(event.focalX - photo.width / 2),
          y: -(event.focalY - photo.height / 2),
        };
      }

      isScaling.value = true;
    },

    onUpdate: event => {
      const savedScale = Math.max(
        Math.hypot(matrix.value[0], matrix.value[1]),
        0.0001,
      );

      const nextGestureScale = scale.value * event.scaleChange;
      const nextTotalScale = savedScale * nextGestureScale;

      const constrainedTotalScale = clamp(
        nextTotalScale,
        MINIMUM_PHOTO_SCALE,
        MAXIMUM_PHOTO_SCALE,
      );

      scale.value = constrainedTotalScale / savedScale;
    },

    onDeactivate: () => {
      commitCurrentTransform();
      isScaling.value = false;
    },
  });

  const rotationGesture = useRotationGesture({
    enabled: isSelected,
    onActivate: event => {
      if (!isScaling.value && !isRotating.value) {
        origin.value = {
          x: -(event.anchorX - photo.width / 2),
          y: -(event.anchorY - photo.height / 2),
        };
      }

      isRotating.value = true;
    },

    onUpdate: event => {
      rotation.value += event.rotationChange;
    },

    onDeactivate: () => {
      commitCurrentTransform();
      isRotating.value = false;
    },
  });

  const photoGesture = useSimultaneousGestures(
    selectGesture,
    panGesture,
    pinchGesture,
    rotationGesture,
  );

  const animatedStyle = useAnimatedStyle(() => {
    const nextMatrix = applyTransformations(
      translation.value,
      scale.value,
      rotation.value,
      origin.value,
      matrix.value,
    );

    const constrainedMatrix = constrainPhotoPosition(
      nextMatrix,
      photo.width,
      photo.height,
      editorSize,
    );

    return {
      transform: [
        {
          translateX: constrainedMatrix[6],
        },
        {
          translateY: constrainedMatrix[7],
        },
        {
          scale: Math.hypot(constrainedMatrix[0], constrainedMatrix[1]),
        },
        {
          rotateZ: `${Math.atan2(
            constrainedMatrix[1],
            constrainedMatrix[0],
          )}rad`,
        },
      ],
    };
  });

  return (
    <GestureDetector gesture={photoGesture}>
      <Animated.Image
        accessible
        accessibilityRole="image"
        accessibilityLabel={`다이어리 사진 ${index + 1}`}
        accessibilityState={{ selected: isSelected }}
        source={{
          uri: photo.uri,
        }}
        resizeMode="contain"
        style={[
          styles.photo,
          {
            width: photo.width,
            height: photo.height,
          },
          animatedStyle,
        ]}
      />
    </GestureDetector>
  );
}

function DiaryPhotos({
  photos,
  editorSize,
  selectedPhotoId,
  onSelectPhoto,
  onChangePhoto,
}: DiaryPhotosProps) {
  return (
    <>
      {photos.map((photo, index) => (
        <DiaryPhotoItem
          key={photo.id}
          photo={photo}
          index={index}
          editorSize={editorSize}
          isSelected={photo.id === selectedPhotoId}
          onSelectPhoto={onSelectPhoto}
          onChangePhoto={onChangePhoto}
        />
      ))}
    </>
  );
}

export default DiaryPhotos;

const styles = StyleSheet.create({
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
