import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import AppSkeleton from './common/AppSkeleton.tsx';

type CoverPattern = 'solid' | 'stripe';

type DiaryCoverProps = {
  /** 안쪽 표지 색상 */
  coverColor: string;
  /** 안쪽 표지 패턴 */
  coverPattern?: CoverPattern;
  /** 포토카드 슬롯 이미지 URI */
  photoUri?: string;
  /** 컴포넌트 너비 (기본 224) */
  size?: number;
};

/** 6공 링 Y좌표 — 위 3개 + 여백 + 아래 3개 */
const RING_Y = [52, 74, 96, 168, 190, 212];
const WIDTH_SCALE = 1.06;

function DiaryCover({
  coverColor,
  coverPattern = 'solid',
  photoUri,
  size = 224,
}: DiaryCoverProps) {
  const w = size * WIDTH_SCALE;
  const h = size * (300 / 250);
  const [loadedPhotoUri, setLoadedPhotoUri] = useState<string | null>(null);
  const isPhotoLoading = Boolean(photoUri && loadedPhotoUri !== photoUri);

  useEffect(() => {
    if (!photoUri) {
      return;
    }

    const currentPhotoUri = photoUri;
    let isActive = true;

    async function preparePhoto() {
      try {
        await Image.prefetch(currentPhotoUri);
      } catch {}

      if (isActive) {
        setLoadedPhotoUri(currentPhotoUri);
      }
    }

    preparePhoto();

    return () => {
      isActive = false;
    };
  }, [photoUri]);

  return (
    <View style={[styles.container, { width: w, height: h }]}>
      <Svg width={w} height={h} viewBox="-12 0 250 300">
        <Defs>
          {/* 금속은 왼쪽의 좁은 반사와 오른쪽의 어두운 면으로 입체감을 준다. */}
          <LinearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="rgb(60,75,85)" />
            <Stop offset="0.12" stopColor="#BCC3C8" />
            <Stop offset="0.25" stopColor="#FAFBFB" />
            <Stop offset="0.38" stopColor="#DCE0E3" />
            <Stop offset="0.55" stopColor="#8E959C" />
            <Stop offset="0.84" stopColor="#BCC3C8" />
            <Stop offset="1" stopColor="rgb(60,75,85)" />
          </LinearGradient>
          <LinearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FAFBFB" />
            <Stop offset="0.3" stopColor="#EEF0F2" />
            <Stop offset="0.55" stopColor="#BCC3C8" />
            <Stop offset="1" stopColor="#8E959C" />
          </LinearGradient>
          <RadialGradient id="snapGrad" cx="0.36" cy="0.28" r="0.7">
            <Stop offset="0" stopColor="#FAFBFB" />
            <Stop offset="0.35" stopColor="#EAEDEF" />
            <Stop offset="0.72" stopColor="#D5DADD" />
            <Stop offset="1" stopColor="rgb(82,98,108)" />
          </RadialGradient>
          <ClipPath id="coverClip">
            <Rect x="38" y="16" width="148" height="238" rx="3" />
          </ClipPath>
          <ClipPath id="photoClip">
            <Rect x="80" y="146" width="64" height="95" rx="2" />
          </ClipPath>
        </Defs>

        <Rect x="38" y="16" width="148" height="238" rx="3" fill={coverColor} />
        {coverPattern === 'stripe' && (
          <G clipPath="url(#coverClip)" opacity="0.7">
            {[46, 58, 70, 82, 94, 106, 118, 130, 142, 154, 166, 178].map(x => (
              <Line
                key={`stripe-${x}`}
                x1={x}
                y1="16"
                x2={x}
                y2="254"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1.6"
              />
            ))}
          </G>
        )}
        <Rect
          x="38"
          y="16"
          width="148"
          height="238"
          rx="3"
          fill="none"
          stroke="rgba(82,98,108,0.12)"
          strokeWidth="0.6"
        />
        <Path
          d="M 38.5 251 V 19 Q 38.5 16.5, 41 16.5 H 183"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.7"
        />

        {/* 흰 속지가 없는 상태에서는 금속판의 위아래 끝을 색 표지와 맞춘다. */}
        <Rect
          x="19"
          y="16"
          width="12"
          height="238"
          rx="2"
          fill="url(#barGrad)"
          stroke="rgba(82,98,108,0.3)"
          strokeWidth="0.6"
        />
        <Path
          d="M 21 251 V 19 Q 21 17, 24 17"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="0.7"
        />

        {/* 링은 타공까지 한 선으로 연결하고 별도의 뒷면이나 그림자는 그리지 않는다. */}
        {RING_Y.map(y => (
          <G key={`ring-${y}`}>
            <Circle cx="48" cy={y} r="3.5" fill="rgba(60,75,85,0.65)" />
            <Path
              d={`M 25 ${y} C 25 ${y - 3.2}, 45 ${y - 3.2}, 48 ${y}`}
              fill="none"
              stroke="url(#shaftGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <Path
              d={`M 26 ${y - 0.8} C 29 ${y - 3}, 41 ${y - 3}, 45 ${y - 1.5}`}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="0.65"
              strokeLinecap="round"
            />
          </G>
        ))}

        {/* 바깥 표지는 한 겹의 투명한 면과 외곽선만 남긴다. */}
        <Rect
          x="4"
          y="4"
          width="200"
          height="260"
          rx="16"
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(145,155,165,0.55)"
          strokeWidth="1"
        />

        {/* 사진 좌표는 사진 선택 버튼과 로딩 표시가 공유하므로 그대로 유지한다.
            포켓의 세 면에만 얇은 접합선을 그려 사진이 투명 필름 안에 들어가 보이게 한다. */}
        {photoUri && (
          <SvgImage
            href={photoUri}
            x="80"
            y="146"
            width="64"
            height="95"
            clipPath="url(#photoClip)"
            preserveAspectRatio="xMidYMid slice"
            onLoad={() => setLoadedPhotoUri(photoUri)}
          />
        )}
        <Path
          d="M 78 144 V 239 Q 78 244, 83 244 H 141 Q 146 244, 146 239 V 144"
          fill="rgba(255,255,255,0.035)"
          stroke="rgba(82,98,108,0.22)"
          strokeWidth="0.6"
        />
        <Path
          d="M 79 145 V 239 Q 79 243, 83 243 H 141 Q 145 243, 145 239 V 145"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="0.6"
        />
        <Line
          x1="79"
          y1="144"
          x2="145"
          y2="144"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="0.7"
        />

        {/* 잠금 탭도 투명 PVC 한 겹이다. 속표지가 비치도록 불투명한 채움을 피한다. */}
        <Path
          d="M 213 114 Q 220 114, 220 121 V 150 Q 220 157, 213 157 H 185
             C 173 157, 164 147, 164 135.5 C 164 124, 173 114, 185 114 Z"
          fill="rgba(255,255,255,0.15)"
          stroke="rgba(145,155,165,0.45)"
          strokeWidth="0.8"
        />
        <Path
          d="M 185 115.5 C 174 115.5, 165.5 124.5, 165.5 135.5"
          fill="none"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="0.8"
        />

        <Circle
          cx="192"
          cy="135"
          r="10"
          fill="url(#snapGrad)"
          stroke="rgba(82,98,108,0.5)"
          strokeWidth="0.7"
        />
        <Path
          d="M 184 135 A 8 8 0 0 1 192 127"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="0.6"
        />
      </Svg>

      {isPhotoLoading ? (
        <AppSkeleton
          width={size * 0.256}
          height={size * 0.38}
          borderRadius={size * 0.016}
          style={[
            styles.photoSkeleton,
            {
              left: size * 0.398,
              top: size * 0.584,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

export default DiaryCover;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  photoSkeleton: {
    position: 'absolute',
  },
});
