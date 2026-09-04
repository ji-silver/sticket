<p align="center">
  <img src="./src/assets/auth/ticket_logo.png" width="140" alt="Sticket 로고" />
</p>

<h1 align="center">스티켓</h1>

<p align="center">
  직관의 순간을 티켓처럼 남기는 iOS 스포츠 기록 앱
</p>

<p align="center">
  <a href="https://apps.apple.com/kr/app/%EC%8A%A4%ED%8B%B0%EC%BC%93/id6800050133">
    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" height="54" alt="App Store에서 다운로드" />
  </a>
</p>

## 소개

스티켓은 스포츠팬이 현장에서 본 경기를 티켓으로 기록하고, 그날의 추억을 다이어리로 꾸밀 수 있는 React Native iOS 앱입니다. 경기 일정과 연동해 직관 기록을 간편하게 남기고, 캘린더와 시즌 통계로 나의
응원 여정을 다시 돌아볼 수 있습니다.

현재 MVP는 KBO 야구 기록을 지원하며, 이후 축구, 농구, 배구 등으로 확장할 예정입니다.

## 미리보기

<p align="center">
  <img src="./docs/images/sticket1.p리ng" width="200" alt="티켓 목록 화면" />
  <img src="./docs/images/sticket2.png" width="200" alt="다이어리 화면" />
  <img src="./docs/images/sticket3.png" width="200" alt="티켓북 화면" />
</p>

<p align="center">
  <img src="./docs/images/sticket4.png" width="200" alt="캘린더 화면" />
  <img src="./docs/images/sticket5.png" width="200" alt="경기 기록 화면" />
</p>

## 주요 기능

- **직관 티켓**: 경기, 경기장별 좌석, 라인업, 만족도, 메모와 경기장 음식을 기록합니다.
- **원본 티켓 보관**: 지류 티켓이나 모바일 티켓 이미지를 함께 저장합니다.
- **다이어리**: 촬영하거나 불러온 사진, 스티커, 텍스트와 손그림으로 추억을 꾸미고 이미지로 공유합니다.
- **캘린더**: 날짜별 우리팀 경기 일정과 직관 기록을 한눈에 확인합니다.
- **직관 통계**: 응원팀의 시즌 직관 경기 수와 승률을 보여줍니다.
- **버킷리스트**: 이루고 싶은 직관 목표를 추가하고 관리합니다.
- **소셜 로그인**: Apple 및 Google 계정으로 로그인하고 데이터를 동기화합니다.

## 기술적 설계와 개선

- 티켓을 시즌별로 조회하고 `SectionList`로 가상화해 누적 기록이 늘어나도 필요한 카드만 렌더링합니다.
- 서버 상태는 TanStack Query, 화면 편집 상태는 Zustand와 컴포넌트 상태로 분리합니다.
- PostgreSQL RLS와 Storage 정책으로 사용자별 데이터 접근 범위를 제한합니다.
- 로컬 Docker, 원격 개발 DB, 운영 DB를 분리해 마이그레이션 검증과 앱 테스트가 운영 데이터에 영향을 주지 않도록 구성했습니다.
- Playwright 수집기와 GitHub Actions로 KBO 경기 일정, 상태와 라인업을 자동으로 동기화합니다.
- PencilKit을 연동해 네이티브 손그림 편집과 다이어리 이미지 내보내기를 지원합니다.

## 기술 스택

| 영역             | 기술                                                 |
|----------------|----------------------------------------------------|
| App            | React Native 0.86, React 19, TypeScript            |
| Navigation     | React Navigation                                   |
| Server state   | TanStack Query                                     |
| Local state    | Zustand                                            |
| Backend        | Supabase Auth, PostgreSQL, Storage, Edge Functions |
| UI / Native    | PencilKit, Image Crop Picker, Reanimated           |
| Test           | Jest, React Native Testing Library                 |
| Data collector | Playwright, GitHub Actions                         |

## 동작 구조

```text
React Native iOS App
├── Apple / Google 로그인
├── Supabase Auth
├── Supabase PostgreSQL + RLS
├── Supabase Storage
└── Supabase Edge Functions

GitHub Actions
└── Playwright KBO Collector
    └── 경기 일정·상태·라인업 동기화
```

서버 데이터는 TanStack Query로 조회 및 캐싱하고, 화면의 일시적인 편집 상태는 Zustand 또는 컴포넌트 상태로 관리합니다. 데이터 접근 로직은 도메인별 `features` 서비스에 모으고
Supabase RLS로 사용자 데이터 접근을 제한합니다.

## KBO 데이터 수집

`collector`는 Playwright로 KBO 경기 일정, 경기 상태와 라인업을 수집해 Supabase에 동기화합니다. 운영 환경에서는 GitHub Actions가 수집기를 정해진 시간에 실행하며, 관리자 키는
저장소가 아닌 GitHub Secrets로 관리합니다.

## 품질 확인

```bash
npm run verify       # lint, typecheck, 앱 테스트, 수집기 테스트
npm run verify:db    # 로컬 Supabase reset과 RLS 테스트 (Docker 필요)
npm run verify:ios   # iOS Simulator용 Debug 빌드
```
