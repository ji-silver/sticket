# Sticket 작업 계약

## 구조

- `src/screens`: 화면 구성과 일시적인 화면 상태
- `src/features`: 도메인 타입, 서비스, React Query 훅
- `src/components/common`: 여러 화면이 공유하는 UI
- `src/lib`: Supabase 클라이언트와 순수 공통 로직
- `collector`: KBO 데이터 수집기
- `supabase/migrations`: 스키마와 RLS 변경 이력
- `harness/SCENARIOS.md`: 네이티브 기능의 수동 smoke 기준

## 작업 원칙

- 수정 전 관련 호출처와 기존 구현 패턴을 찾는다.
- 화면에서 Supabase를 직접 호출하지 않고 `src/features`의 서비스를 사용한다.
- 서버 상태는 React Query, 화면 편집 상태는 컴포넌트 상태나 Zustand를 사용한다.
- 새 의존성은 기존 코드, 표준 라이브러리, 플랫폼 기능으로 해결할 수 없을 때만 추가한다.
- 관련 없는 사용자 변경을 수정하거나 되돌리지 않는다.
- 관리자 키와 private key를 코드, fixture, 로그에 넣지 않는다.

## 테스트

- 버그 수정에는 실패를 재현하는 가장 가까운 테스트를 추가하거나 수정한다.
- 테스트는 대상 파일 옆에 두고 스타일보다 사용자 행동과 비즈니스 결과를 검증한다.
- RNTL 14의 `render`, `fireEvent`, `userEvent`는 비동기이므로 기다린다.
- 외부 API, 네이티브 모듈, 저장소와 내비게이션 경계만 mock하고 내부 로직은 실제로 실행한다.
- 관련 테스트를 먼저 실행한 뒤 `npm run verify`를 실행한다.

## 변경별 검증

| 변경 | 필수 검증 |
| --- | --- |
| `src/**/*.ts`, `src/**/*.tsx` | 관련 Jest 테스트, `npm run verify` |
| `collector/**` | `npm run test:collector` |
| `supabase/migrations/**` | 새 migration 추가, `npm run verify:db` |
| `ios/**` 또는 네이티브 의존성 | `npm run verify:ios` |
| 다이어리, 사진, PencilKit, 제스처 | 관련 테스트와 `harness/SCENARIOS.md` smoke |
| `web/**` 시각 변경 | 변경 전후 렌더링 확인, 의도하지 않은 범용 AI 스타일을 먼저 보고한 뒤 수정 |

## 디자인

- `src/styles/colors.ts`, `src/styles/fonts.ts`, 기존 공통 컴포넌트를 우선 사용한다.
- 근거 없는 새 색상, 그라디언트, 글래스 효과, 중첩 카드, 과도한 pill과 그림자를 추가하지 않는다.
- 시각적 변경은 실제 화면을 렌더링해 확인하고, 확인하지 못했다면 이유를 보고한다.

## 완료 조건

- 요청한 행동과 회귀 테스트가 통과한다.
- 변경 범위에 해당하는 검증 명령이 통과한다.
- 실행하지 못한 검증과 남은 위험을 명시한다.
- 최종 diff에 관련 없는 파일이 포함되지 않는다.
