# VP VisualTask → Codex App Server → Task 문서 저장

## 목적

VP Review Console에서 생성한 `VisualTask`를 Local Task Gateway가 받아 Codex App Server로
전달하고, Codex가 정리한 요청 문서를 저장소 루트의 `task/<task-id>.md`에 저장하도록
구현했다.

이번 범위에서는 사용자 식별 정보를 수집하지 않으며 게임 코드를 수정하지 않는다. Codex는
읽기 전용 sandbox에서 Markdown 내용만 생성하고, 실제 파일 저장은 Gateway가 담당한다.

## 전체 흐름

```text
VP Review Console
  → POST /api/tasks
  → Local Task Gateway
  → codex app-server (stdio JSONL)
  → initialize / thread/start / turn/start
  → structured { markdown } response
  → task/<task-id>.md
  → GET /api/tasks/:id polling
```

Gateway는 시작할 때 `codex app-server --listen stdio://`를 자식 프로세스로 실행한다. 연결마다
`initialize`와 `initialized`를 처리하고, Task마다 ephemeral thread와 turn을 만든다.

Codex turn에는 다음 제한이 적용된다.

- `approvalPolicy: "never"`
- thread sandbox: `read-only`
- turn sandbox policy: `{ type: "readOnly", networkAccess: false }`
- 최종 응답 schema: `{ markdown: string }`
- 모델은 지정하지 않고 사용자의 로컬 Codex 기본 설정을 사용한다.

## HTTP API와 상태 계약

### Task 제출

```http
POST /api/tasks
Content-Type: application/json
```

Gateway는 VisualTask를 검증하고 App Server가 thread와 turn을 접수할 때까지 기다린다.

성공 응답:

```json
{
  "taskId": "visual-123",
  "status": "accepted",
  "receivedAt": "2026-08-26T13:52:02.981Z"
}
```

주요 실패 응답:

- `400 invalid_json`
- `413 body_too_large`
- `422 invalid_visual_task`
- `409 task_in_progress` 또는 `task_conflict`
- `503 codex_unavailable`

Task ID는 영문, 숫자, `.`, `_`, `-`만 허용하며 최대 128자다. 경로 이동 문자열과 기존
Task 파일 덮어쓰기는 거부한다. V1에서는 한 번에 하나의 Task만 처리한다.

### Task 상태 조회

```http
GET /api/tasks/:id
```

상태와 VP 표시 문구는 다음과 같다.

| API 상태    | VP 문구      |
| ----------- | ------------ |
| `accepted`  | 요청 성공    |
| `reviewing` | Task 검토중  |
| `editing`   | 코드 수정 중 |
| `completed` | 작업 완료    |
| `failed`    | 작업 실패    |

`코드 수정 중`은 요청에 따라 유지한 문구다. 현재 실제 동작은 게임 코드 수정이 아니라 Codex가
Task Markdown을 작성하는 단계다.

VP는 POST 결과를 즉시 Success/Fail 카드로 표시하고, 성공한 Task는 1초 간격으로 GET을
폴링한다. 일시적인 조회 오류에서는 마지막으로 확인한 진행 상태를 유지한 채 `RETRYING`을
표시한다. `completed` 또는 `failed`에서 폴링을 종료하고 화면이 해제될 때 모든 timer를
정리한다.

## Task 문서 저장

Codex는 다음 내용을 포함한 한국어 Markdown을 구조화한다.

- 요청 요약
- 선택 대상의 id, kind, label, bounds, source
- 페이지 URL, viewport, 선택적 Git SHA
- 원본 VisualTask JSON

Gateway는 `task` 디렉터리에 임시 파일을 만든 뒤 hard link로 최종 파일을 생성하고 임시 파일을
삭제한다. 이 과정으로 기존 파일을 원자적으로 덮어쓰지 않도록 보장한다. 완료 상태는 Codex turn
성공뿐 아니라 Markdown 검증과 파일 저장까지 모두 성공한 뒤에만 설정된다.

Task 상태는 현재 Gateway 메모리에만 유지된다. 서버를 재시작하면 진행 상태 조회 기록은
사라지지만 이미 완료된 Markdown 파일은 남는다.

## 주요 파일

- `tools/review-server/codex-client.mjs`: App Server 자식 프로세스, JSONL RPC, 요청 timeout,
  notification 및 종료 처리
- `tools/review-server/task-gateway.mjs`: VisualTask 검증, prompt 생성, 상태 머신, Markdown 저장
- `tools/review-server/server.mjs`: HTTP API, health readiness, 요청 크기 제한, graceful shutdown
- `src/editor/review/taskClient.ts`: Task 제출과 상태 조회 클라이언트
- `src/editor/review/reviewApp.ts`: Success/Fail Task 카드와 polling
- `src/editor/review/review.css`: Task 카드와 단계별 상태 스타일
- `tests/review-server/`: RPC와 Gateway 상태·저장 테스트
- `task/README.md`: 생성 문서 디렉터리 설명
- `README-V1.md`: 현재 App Server 연결 경계와 실행 방법

## 검증 결과

다음 검증을 통과했다.

```bash
pnpm run typecheck
pnpm run test:run tests/review-server
pnpm run build:editor
```

- Gateway/App Server 관련 테스트 8건 통과
- 실제 `pnpm run review:server` 기동 후 `/health`에서 App Server `ready` 확인
- 실제 smoke VisualTask 제출 결과 `202 accepted → reviewing → completed` 전환 확인
- Codex가 생성한 한국어 Markdown의 `task/visual-smoke-test.md` 저장 확인
- smoke 파일과 테스트 서버 프로세스는 검증 후 정리함
- `git diff --check` 통과

전체 `pnpm run test:run`은 196건 중 191건이 통과하고 5건이 실패한다. 실패는 이번 작업에서
수정하지 않은 `src/game/scenes/game/controller.ts:214`가 테스트용 이벤트의 누락된
`event.code`에 `startsWith()`를 호출하는 기존 문제다. 실패 대상은
`tests/game/scenePreparation.test.ts`의 웜홀 입력 차단 및 힌트 제거 관련 5건이다.

## 실행 환경에서 확인된 경고

실제 App Server 기동 시 시스템 PATH에서 `bubblewrap`을 찾지 못해 bundled bubblewrap을
사용한다는 경고가 출력됐다. 또한 shell snapshot 스크립트의 기존 구문 오류 로그가 한 번
출력됐지만, 읽기 전용 Task turn과 Markdown 생성·저장에는 영향을 주지 않았다.

Gateway는 기존 로컬 Codex 로그인을 사용한다. 로그인되어 있지 않거나 App Server 초기화가
실패하면 `/health`는 `503`을 반환하고 Task 제출도 `codex_unavailable`로 실패한다.

## 후속 작업 시 주의 사항

1. 실제 게임 코드 수정 단계를 추가하려면 현재 읽기 전용 turn과 명확히 분리하고 별도 승인 및
   workspace-write 정책을 설계한다.
2. 상태를 서버 재시작 후에도 유지해야 한다면 Task record를 디스크 또는 DB에 영속화한다.
3. 다중 Task가 필요하면 단일 `activeTaskId` 대신 FIFO queue와 Task별 notification routing을
   추가한다.
4. VP의 `코드 수정 중` 문구는 현재 동작과 의미가 다르므로 실제 코드 수정 단계가 확정될 때
   상태 이름과 이벤트 매핑을 다시 검토한다.
5. 전체 테스트를 green으로 만들 때는 VisualTask 변경과 분리하여 게임 컨트롤러의
   `KeyboardEvent.code` fallback 또는 테스트 fixture를 수정한다.
