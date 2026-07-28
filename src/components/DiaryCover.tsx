import React from 'react';
import {View} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
  Line,
  RadialGradient,
  ClipPath,
  Image as SvgImage,
} from 'react-native-svg';

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

  return (
    <View style={{width: w, height: h}}>
      <Svg width={w} height={h} viewBox="-12 0 250 300">
        <Defs>
          {/* ── 바인더 봉 금속 ── */}
          <LinearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#8E959C" />
            <Stop offset="0.15" stopColor="#BEC5CA" />
            <Stop offset="0.35" stopColor="#DCE0E3" />
            <Stop offset="0.5" stopColor="#EEF0F2" />
            <Stop offset="0.65" stopColor="#DCE0E3" />
            <Stop offset="0.85" stopColor="#BCC3C8" />
            <Stop offset="1" stopColor="#8E959C" />
          </LinearGradient>

          {/* ── 핀 샤프트 금속 ── */}
          <LinearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D2D7DB" />
            <Stop offset="0.25" stopColor="#E6EAEC" />
            <Stop offset="0.45" stopColor="#F0F2F4" />
            <Stop offset="0.7" stopColor="#E0E4E7" />
            <Stop offset="1" stopColor="#C2C9CE" />
          </LinearGradient>

          {/* ── PVC 프로스트 ── */}
          <LinearGradient id="pvcFrost" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.32" />
            <Stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0.11" />
            <Stop offset="0.56" stopColor="#EAF1F5" stopOpacity="0.05" />
            <Stop offset="0.78" stopColor="#FFFFFF" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#E4EDF2" stopOpacity="0.12" />
          </LinearGradient>

          {/* ── 스냅 버튼 ── */}
          <RadialGradient id="snapGrad" cx="0.4" cy="0.33" r="0.6">
            <Stop offset="0" stopColor="#FAFBFB" />
            <Stop offset="0.35" stopColor="#EAEDEF" />
            <Stop offset="0.7" stopColor="#D5DADD" />
            <Stop offset="1" stopColor="#BFC7CC" />
          </RadialGradient>

          {/* ── 포토 클리핑 ── */}
          <ClipPath id="photoClip">
            <Rect x="80" y="146" width="64" height="95" rx="4" />
          </ClipPath>

          {/* ── 포켓 그라디언트 ── */}
          <LinearGradient id="pocketGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.0" />
            <Stop offset="0.25" stopColor="#FFFFFF" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.35" />
          </LinearGradient>
        </Defs>

        {/* PVC 커버의 깊이는 한 겹의 옅은 그림자로만 표현 */}
        <Rect
          x="7" y="9" width="198" height="260"
          rx="22"
          fill="rgba(143,164,178,0.14)"
        />

        {/* ═══════════════════════════════════════════
            4) 안쪽 표지 (사용자 색상)
        ═══════════════════════════════════════════ */}
        {/* 표지가 PVC 안쪽에 들어가 보이도록 오른쪽과 아래에만 깊이를 추가 */}
        <Path
          d="M 40 17 H 174 Q 189 17, 189 31 V 243 Q 189 257, 175 257 H 40 Z"
          fill="rgba(82,98,108,0.10)"
        />
        <Path
          d="M 38 14 H 172 Q 186 14, 186 28 V 240 Q 186 254, 172 254 H 38 Z"
          fill={coverColor}
        />
        {coverPattern === 'stripe' && (
          <G opacity="0.7">
            {[46, 58, 70, 82, 94, 106, 118, 130, 142, 154, 166, 178].map(x => (
              <Line
                key={`stripe-${x}`}
                x1={x}
                y1="14"
                x2={x}
                y2="254"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1.6"
              />
            ))}
          </G>
        )}
        <Path
          d="M 38 14 H 172 Q 186 14, 186 28 V 240 Q 186 254, 172 254 H 38 Z"
          fill="none"
          stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"
        />

        {/* ═══════════════════════════════════════════
            5) 속지 페이지 뭉치
        ═══════════════════════════════════════════ */}
        <Line x1="35.5" y1="22" x2="35.5" y2="248" stroke="rgba(238,243,246,0.7)" strokeWidth="1" />

        {/* ═══════════════════════════════════════════
            6) 바인더 봉
        ═══════════════════════════════════════════ */}
        <Rect x="20" y="17" width="10" height="232" rx="3" fill="url(#barGrad)" />
        <Line x1="24.5" y1="22" x2="24.5" y2="244" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />

        {/* ═══════════════════════════════════════════
            7) 표지 구멍
        ═══════════════════════════════════════════ */}
        {RING_Y.map(y => (
          <G key={`hole-${y}`}>
            <Circle
              cx="48" cy={y + 0.8} r="6.2"
              fill="rgba(70,82,90,0.10)"
            />
            <Circle
              cx="48" cy={y} r="5.8"
              fill="rgba(255,255,255,0.42)"
              stroke="rgba(178,190,198,0.55)"
              strokeWidth="1.2"
            />
            <Circle
              cx="48" cy={y} r="3.4"
              fill="rgba(185,195,202,0.35)"
            />
          </G>
        ))}

        {/* ═══════════════════════════════════════════
            8) 6공 링
        ═══════════════════════════════════════════ */}
        {RING_Y.map(y => (
          <G key={`ring-${y}`}>
            <Rect x="28" y={y + 0.8} width="24" height="3.8" rx="1.9" fill="rgba(60,75,85,0.10)" />
            <Rect
              x="27"
              y={y - 2.2}
              width="25"
              height="4.4"
              rx="2.2"
              fill="url(#shaftGrad)"
              stroke="rgba(145,155,165,0.28)"
              strokeWidth="0.4"
            />
            <Line
              x1="29"
              y1={y - 1.1}
              x2="50"
              y2={y - 1.1}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="0.7"
              strokeLinecap="round"
            />
          </G>
        ))}

        {/* PVC 앞면 — 바깥선과 안쪽 하이라이트만 유지 */}
        <Rect
          x="4" y="4" width="200" height="260"
          rx="22"
          fill="url(#pvcFrost)"
          stroke="rgba(190,205,214,0.34)"
          strokeWidth="1.2"
        />
        <Rect
          x="6.5" y="6.5" width="195" height="255"
          rx="20"
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="0.7"
        />
        {/* 선 대신 면으로 표현한 PVC 상단 반사광 */}
        <Path
          d="M 21 7 H 181 Q 197 7, 201 23 L 198 28 Q 195 11, 180 11 H 21 Z"
          fill="rgba(255,255,255,0.20)"
        />

        {/* ═══════════════════════════════════════════
            10) 포토카드 포켓
        ═══════════════════════════════════════════ */}
        {/* 사진은 바깥 PVC 위, 포켓 막 아래에 두어 색감을 유지 */}
        {photoUri && (
          <>
            <Rect
              x="79"
              y="145"
              width="66"
              height="97"
              rx="5"
              fill="rgba(45,55,65,0.14)"
            />
            <SvgImage
              href={photoUri}
              x="80"
              y="146"
              width="64"
              height="95"
              clipPath="url(#photoClip)"
              preserveAspectRatio="xMidYMid slice"
            />
          </>
        )}
        <Rect
          x="78" y="143" width="68" height="101"
          rx="8" fill="rgba(255,255,255,0.13)"
        />
        <Path
          d={`
            M 78 145
            L 78 235
            Q 78 244, 87 244
            L 137 244
            Q 146 244, 146 235
            L 146 145
          `}
          fill="url(#pocketGrad)"
          stroke="rgba(232,238,241,0.52)"
          strokeWidth="1.2" strokeLinejoin="round"
        />
        <Path
          d="M 82 145 H 142"
          fill="none"
          stroke="rgba(255,255,255,0.34)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* ═══════════════════════════════════════════
            11) 스냅 잠금 탭 — 가로 넓고 위아래 짧게
                높이 ~40px, 가로 넓게
        ═══════════════════════════════════════════ */}
        {/* 탭 그림자 */}
        <Path
          d={`
            M 222 115
            Q 222 111, 218 111
            L 184 111
            C 171 111, 162 121, 162 135
            C 162 149, 171 159, 184 159
            L 218 159
            Q 222 159, 222 155
            Z
          `}
          fill="rgba(140,155,165,0.05)"
        />
        {/* 탭 본체 — 가로로 넓고 위아래 짧게 */}
        <Path
          d={`
            M 220 117
            Q 220 113, 216 113
            L 185 113
            C 173 113, 164 123, 164 135
            C 164 147, 173 157, 185 157
            L 216 157
            Q 220 157, 220 153
            Z
          `}
          fill="rgba(238,242,245,0.5)"
          stroke="rgba(195,207,215,0.55)"
          strokeWidth="1.5"
        />
        {/* 탭 이너 */}
        <Path
          d={`
            M 216 122
            Q 216 119, 213 119
            L 187 119
            C 179 119, 173 126, 173 135
            C 173 144, 179 151, 187 151
            L 213 151
            Q 216 151, 216 148
            Z
          `}
          fill="none"
          stroke="rgba(215,224,230,0.22)"
          strokeWidth="0.5"
        />
        {/* 버튼 */}
        <Circle cx="192" cy="137" r="12.5" fill="rgba(100,115,125,0.08)" />
        <Circle
          cx="192" cy="135" r="12"
          fill="url(#snapGrad)"
          stroke="rgba(170,182,190,0.45)"
          strokeWidth="1.2"
        />
        <Circle cx="189" cy="130" r="4.2" fill="rgba(255,255,255,0.45)" />
        <Circle cx="192" cy="135" r="1.6" fill="rgba(195,205,212,0.25)" />
      </Svg>
    </View>
  );
}

export default DiaryCover;
