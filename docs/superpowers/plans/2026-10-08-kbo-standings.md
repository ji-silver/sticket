# KBO Standings Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 캘린더에서 공식 KBO 전체 순위를 확인하고 응원 구단을 찾는다.
**Architecture:** 수집기는 검증된 10개 구단 스냅샷을 한 번에 저장한다. 앱 서비스와 React Query가 조회하고 중앙 모달이 표시한다.
**Tech Stack:** 기존 React Native, React Query, Supabase, Playwright, Jest와 pgTAP.
**Spec:** `docs/superpowers/specs/2026-10-08-kbo-standings-design.md`

## Global Constraints

- 바텀시트 제외. 작은 화면에서는 모달을 전체 화면으로 넓힌다.
- 새 의존성 없이 기존 글꼴, 색상, 공통 텍스트와 버튼을 사용한다.
- 가입 때 설정한 구단만 강조하고 구단 선택 기능을 추가하지 않는다.
- 화면은 Supabase를 직접 호출하지 않는다.
- 운영 데이터 배포와 로컬 검증은 구분한다.

## Review Focus

- 부분 수집과 중복 구단은 이전 스냅샷을 덮어쓰지 않는다: 수집기 검증 테스트.
- 이전 시즌과 잘못된 기준일은 현재 순위로 표시하지 않는다: 서비스·수집기 테스트.
- 첫 조회 실패 후 재시도와 캐시 갱신 실패가 빈 순위로 보이지 않는다: 모달 행동 테스트.
- 동률 순위와 무승부만 있는 성적을 임의 순위나 0%로 바꾸지 않는다: 파서·모달 테스트.
- 작은 화면과 큰 글자에서도 표를 읽고 닫을 수 있다: 실제 시뮬레이터 확인.

## Task 1: 순위 데이터와 저장 경계

**Files:** `src/features/standings/{types.ts,standings.ts,standings.service.ts,standings.service.test.ts}`, `src/features/standings/api/useGetKboStandings.ts`, `src/lib/database.types.ts`, `supabase/migrations/20261008000000_create_kbo_standings.sql`, `supabase/tests/kbo_standings.test.sql`
**Interfaces:** `parseStandings(unknown): KboStanding[]`, `getKboStandings(season: number): Promise<KboStandingsSnapshot | null>`.

- [x] 실패 테스트: 정상 10구단 조회, 누락·중복·잘못된 수치 거부, 시즌·날짜 불일치, API 오류 전파.
- [x] 관련 Jest 테스트에서 실패 확인 후 파서, 서비스, 5분 캐시 훅 구현.
- [x] 시즌 PK의 JSON 스냅샷 테이블과 조회 전용 authenticated 권한 추가. 역행 기준일 업데이트 차단.
- [x] pgTAP으로 anon 거부, authenticated 조회 허용·쓰기 거부, service_role 저장과 날짜 역행 차단 검증.

## Task 2: 공식 순위 수집

**Files:** `collector/src/{kboStandings.ts,kboStandings.check.ts,collectStandings.ts}`, `collector/package.json`, `.github/workflows/collect-kbo.yml`, `README.md`
**Interfaces:** `parseKboStandings(dateText: string, rows: string[][], season: number): KboStandingsSnapshot`.

- [x] 공식 열 순서, 동률, '-' 승률, 누락·중복 구단, 잘못된 기준일 테스트를 먼저 작성·실패 확인.
- [x] Playwright로 공식 표·기준일을 읽고 공유 검증 후 스냅샷 한 건 upsert.
- [x] 당일·전날 수집 후 순위 수집 실행 및 수동 standings 모드 추가. dry-run은 외부 DB에 쓰지 않는다.
- [x] `npm run test:collector` 통과와 공식 페이지 dry-run 확인.

## Task 3: 순위 모달과 진입

**Files:** `src/screens/home/components/{KboStandingsModal.tsx,KboStandingsModal.test.tsx}`, `src/screens/home/{CalendarScreen.tsx,CalendarScreen.test.tsx}`
**Interfaces:** 모달 props `{ visible, favoriteTeamId, onClose }`; 데이터는 Task 1 훅 사용.

- [x] Supabase 경계만 mock해서 열기·조회·닫기, 응원 구단, 기준일 미표시, 동률, 집계 전, 재시도와 캐시 유지 테스트 작성·실패 확인.
- [x] 기존 가운데 캘린더 제목을 유지하고 오른쪽에 테두리 버튼 추가.
- [x] 중앙 모달 안에 얇은 구분선으로 7열 표 표시. 큰 글자에서는 크기와 열 너비를 함께 확대.
- [x] 관련 Jest → `npm run verify` → `npm run verify:db`.
- [x] iPhone 17 Pro 실제 시뮬레이터에서 정상 순위, 닫기와 재열기 확인. 스캔과 최종 diff 검토.

## Execution Record

사용자가 구현 진행과 바텀시트를 제외한 구체적 표현 방식 선택을 위임했다. 이 세션에서 직접 구현한다.
현재 앱의 실행 환경을 유지하기 위해 기존 작업 폴더를 사용하고, 관련 없는 변경은 건드리지 않는다.
검증 전 commit/push나 운영 DB 반영은 하지 않는다.

## Verification Record

- 2026-10-09 커밋 전 `npm run verify`: lint·타입 검사, 앱 테스트 266개, 수집기 테스트 23개 통과.
- `npm run verify:db`: 로컬 Supabase migration 전체 적용과 DB 테스트 12개 통과.
- 공식 KBO 페이지 dry-run 성공. 개발 Supabase의 미적용 migration을 확인하고 새 migration 한 건만 반영했다.
- 개발 환경에 2026-10-07 기준 공식 순위 10개 구단을 저장한 뒤 앱에서 실제 조회를 확인했다.
- iPhone 17 Pro / iOS 26.5에서 버튼 테두리, 중앙 모달, 전체 표, 응원 구단 강조, 출처·기준일 제거와 닫기·재열기 확인.
- 후속 리뷰에서 정상 음수 게임차를 거부하는 결함을 찾았다. 앱·수집기 회귀 테스트 실패를 확인하고 수정 후 통과했다. 음수 경기수와 승패무는 계속 거부한다.
- 실제 HTML 추출 과정과 일반 글자 크기의 중앙 모달 분기 자동 테스트는 후속 보완 대상이다. 현재 모달 테스트의 RN 기본 글자 배율은 2다.
- 스캔 후보 24개는 기존 기능으로 유지됐고 순위 화면의 새 후보는 0개다.
- 작은 기기·Android·큰 글자 설정의 수동 검증은 미실행. 사용 가능한 시뮬레이터에는 작은 iPhone이 없고 현재 앱은 세로 방향 고정이다.
- 전체 검사 중 기존 `AddTicketScreen` 테스트에서 비동기 `act` 경고가 한 번 출력됐지만 실패는 없었다. 해당 파일은 변경하지 않았다.
- 운영 DB와 GitHub Actions 배포는 미실행이며 자동 갱신은 workflow 반영 이후 동작한다.
