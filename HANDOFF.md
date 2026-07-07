# HANDOFF

## 현재 작업 요약

React Native CLI 프로젝트 `sticket`에서 홈 화면의 다이어리/버킷리스트 UI를 정리했고, 새 다이어리 추가 화면을 만들기 시작했다.

최근 작업의 중심은 `AddDiaryScreen`이다. 현재 화면은 상단 헤더, 다이어리 미리보기, 스포츠 선택, 속표지 색상 선택, 포토카드 UI placeholder까지 들어가 있다. 실제 사진 선택 기능과 다이어리 생성 저장 로직은 아직 붙이지 않았다.

## 변경한 주요 파일

- `src/screens/home/HomeScreen.tsx`
  - 홈 화면 조립 역할.
  - `DiarySection`, `BucketListSection` 렌더링.
  - `BucketListSection`은 `initialBuckets`를 props로 받는 형태.

- `src/screens/home/components/DiarySection.tsx`
  - 다이어리 목록을 가로 스크롤로 보여줌.
  - `DiaryCard`와 empty state 포함.
  - `DiaryCover`를 재사용.

- `src/screens/home/components/BucketListSection.tsx`
  - 버킷리스트 조회, 더보기/접기, empty state, 수정 모달 열기 담당.
  - 빈 상태면 버튼 텍스트가 `추가`, 목록이 있으면 `수정`.
  - 버킷 상태는 이 컴포넌트 내부에서 관리.

- `src/screens/home/components/BucketEditModal.tsx`
  - 버킷리스트 추가/수정/삭제/체크 모달.
  - `Modal`은 `fade`, 바텀시트 높이는 고정.
  - 새 항목 추가 시 리스트 하단으로 스크롤.
  - 아직 persistence 없음.

- `src/navigation/RootStackNavigator.tsx`
  - `BottomTabNavigator`를 `MainTab`으로 감싸고, `AddDiary`를 같은 stack 레벨에 둠.
  - `AddDiaryScreen`은 탭에 넣지 않기로 결정.

- `src/screens/diary/AddDiaryScreen.tsx`
  - 새 다이어리 화면.
  - 스포츠 선택 칩 UI.
  - 야구만 ready, 축구/농구/배구는 선택 가능하지만 이후 영역에서 준비중 처리를 할 예정.
  - 속표지 색상 스와치 구현.
  - 포토카드는 현재 UI placeholder만 있음.

- `src/components/DiaryCover.tsx`
  - 기존 `coverColor`에 더해 `coverPattern?: 'solid' | 'stripe'` 추가.
  - `stripe`일 때 실제 다이어리 속표지에 흰/검 세로 줄무늬 표시.
  - 기존 사용처는 `coverPattern` 기본값이 `solid`라 깨지지 않음.

## 디자인/UX 결정사항

- 홈의 다이어리 목록은 전체 화면보다 가로 스크롤형이 맞다고 결정.
- `내 티켓북` 타이틀 사용.
- 다이어리 생성 화면은 탭이 아니라 stack 화면으로 진입.
- `AddDiaryScreen` 헤더는 홈과 맞추기 위해 좌우 24px 기준, 제목은 `19~20 / 800` 정도가 적절.
- 스포츠 선택은 칩 UI.
  - 야구만 실제 생성 가능.
  - 다른 스포츠는 비활성 처리하지 않고 선택 가능하게 둔다.
  - 야구 외 선택 시 하단에 표지색/포토카드 대신 `준비중` UI를 보여줄 예정.
- 속표지 색상은 원본 팀 컬러를 그대로 쓰지 않고 파스텔톤으로 낮춤.
  - 이후 “너무 연함” 피드백으로 한 톤 진하게 조정함.
  - 검정 계열과 스트라이프 검정은 조금 더 살림.
- 흰/검 줄무늬는 스와치만이 아니라 실제 `DiaryCover`에도 반영하기로 결정.
- 포토카드 영역은 상단 다이어리 미리보기에서 실제 위치가 보이므로, 하단에는 작은 프리뷰를 중복으로 두지 않기로 결정.
  - 현재는 단순 row: `이미지 추가` / `선택사항`.
- 사진 자르기 기능은 지금 넣지 않기로 결정.
  - `DiaryCover` 내부 `SvgImage`가 `preserveAspectRatio="xMidYMid slice"`로 cover 처리하므로 MVP에는 충분.

## 현재 `AddDiaryScreen` 상태

현재 주요 데이터:

- `SPORTS`
  - `baseball`: ready
  - `soccer`, `basketball`, `volleyball`: not ready

- `COVER_COLORS`
  - 단색 9개 + 흰/검 stripe 1개.
  - 선택 상태는 color 문자열이 아니라 `selectedCoverColorId`로 관리.
  - 선택된 옵션을 `selectedCoverColor`로 계산해서 `DiaryCover`에 전달.

현재 `DiaryCover` 사용:

```tsx
<DiaryCover
  size={178}
  coverColor={selectedCoverColor.color}
  coverPattern={selectedCoverColor.type}
/>
```

## 남은 작업

1. `AddDiaryScreen`에서 야구 외 스포츠 선택 시 준비중 UI 조건부 렌더링 추가.
   - 현재 `isSelectedSportReady`는 계산만 하고 실제 분기에 충분히 쓰이지 않음.
   - 야구면 속표지 색상/포토카드 표시.
   - 야구 외면 준비중 카드 표시.

2. 하단 고정 생성 버튼 추가.
   - 추천 문구: `야구 다이어리 만들기`.
   - 야구 외 스포츠 선택 시 `준비중이에요`로 비활성화.
   - `SafeAreaView edges={['top', 'bottom']}` 고려.

3. 포토카드 실제 이미지 선택 기능.
   - 나중에 `react-native-image-picker` 검토.
   - 선택한 URI를 `photoUri` state로 저장하고 `DiaryCover`에 전달.
   - 크롭 기능은 보류.

4. 생성 저장 로직.
   - 아직 다이어리를 실제 홈 목록에 추가하지 않음.
   - 임시 상태로 할지, 전역 상태/서버/API 구조로 갈지 나중에 결정.

5. 네비게이션 타입 정리.
   - 현재 일부 `useNavigation` 타입이 느슨할 수 있음.
   - 나중에 `RootStackParamList`를 명시하고 `NativeStackNavigationProp` 적용하면 좋음.

6. UI 최종 QA.
   - iPhone 작은 화면에서 `AddDiaryScreen` 스크롤/하단 버튼 겹침 확인.
   - 다이어리 preview 크기와 섹션 간격 확인.
   - stripe 표지 가독성 확인.

## 주의할 점

- 사용자는 “실무 기준”을 선호하지만 학습 중이라 설명을 자세히 원함.
- 단, 코드 구조는 과하게 추상화하지 않는 방향을 선호.
- 객체는 `interface`, union은 `type`을 선호한다고 말함.
- 임시 id는 숫자를 선호함.
- `DiaryCover`는 여러 화면에서 쓰이므로 props 변경 시 기존 사용처가 깨지지 않아야 함.
- `AddDiaryScreen`의 stripe 스와치는 `left` 절대 위치로 채워야 함. `marginLeft`를 쓰면 가운데에 몇 줄만 몰려 보였음.
- 줄무늬는 검정이 너무 두꺼우면 촌스러워 보여서 현재 얇은 핀스트라이프 방향으로 조정되어 있음.
- 하단 버튼은 화면 최종 액션이므로 스크롤 안이 아니라 고정 footer가 적절.

## 검증

마지막 확인:

```bash
npx tsc --noEmit
```

통과함.
