# VT Task Processor → Worker Pipeline

## 현재 구조

현재는 한 머신에서 실행하지만 runtime 경계는 다음 세 부분으로 분리되어 있다.

```text
VT Review UI
  → Task Processor HTTP API
  → read-only Codex intake
  → taskReady event / in-memory FIFO
  → authenticated HTTP lease
  → Worker daemon
  → detached Git SHA clone
  → workspace-write Codex turn
  → typecheck + game build
  → fake preview URL
  → GET /api/tasks/:id polling
```

Processor와 Worker는 서로의 메모리나 filesystem 경로를 공유하지 않는다. Worker job에는
VisualTask, 생성된 Task Markdown 내용, 고정 실행 지침, Git SHA가 모두 포함된다. 따라서 향후
Worker를 다른 노드로 이동해도 HTTP queue adapter만 유지하면 된다.

## 상태와 Queue

공개 상태는 `queued`, `reviewing`, `ready`, `editing`, `verifying`, `completed`, `failed`다.
Processor는 여러 요청을 접수하지만 intake와 modification lease는 각각 한 번에 하나씩 처리한다.

Worker는 `POST /internal/jobs/lease`를 long-poll하고 lease token으로 heartbeat, progress,
complete/fail을 보고한다. 기본 lease는 60초, heartbeat는 20초, 재시도는 최대 3회다. Worker API는
`VT_WORKER_TOKEN` bearer token으로 보호한다. Queue와 Task record는 아직 메모리에만 있으므로
Processor 재시작 시 복구되지 않는다.

## 수정 실행 경계

Task는 clean 상태의 full Git SHA를 포함해야 한다. Worker는 `VT_REPOSITORY_URL`을 새 디렉터리에
clone하고 해당 SHA를 detached checkout한다. 원본 VT workspace, branch, commit, remote는 건드리지
않으며 성공과 실패 checkout을 모두 수동 검토용으로 보존한다.

수정 turn은 해당 clone만 writable root로 허용하고 network를 비활성화한다. Codex turn이
완료되어도 Worker가 `pnpm run typecheck`와 `pnpm run build:live`를 모두 통과시키기 전에는
`completed`를 보고하지 않는다.

Preview publishing은 adapter 경계만 구현되어 있다. 현재는
`VT_FAKE_PREVIEW_BASE_URL/<task-id>/` URL을 반환하며 실제 artifact upload/deploy는 하지 않는다.

## 실행

`pnpm run dev:vt`는 Processor, Worker, game, Review 서버를 함께 시작하고 임시 shared token,
현재 repository 경로, Git SHA/dirty metadata를 전달한다. 개별 실행 시에는 다음 환경변수가
필수다.

- Processor: `VT_WORKER_TOKEN`
- Worker: `VT_WORKER_TOKEN`, `VT_REPOSITORY_URL`
- 선택: `VT_PROCESSOR_URL`, `VT_WORK_ROOT`, `VT_FAKE_PREVIEW_BASE_URL`, `VT_QUEUE_CAPACITY`

실제 preview hosting, durable queue, Task persistence, Git branch/commit/PR flow는 후속 범위다.
