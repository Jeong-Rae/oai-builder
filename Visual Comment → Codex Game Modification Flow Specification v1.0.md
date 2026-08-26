# Visual Comment → Codex Game Modification Flow Specification v1.0

## 1. 목적

본 시스템의 목적은 **게임 기획자가 실제 실행 중인 게임 화면을 보면서 특정 UI 또는 게임 오브젝트에 Comment를 남기면, 해당 Comment가 실제 로컬 코드 수정까지 연결되도록 하는 것​**이다.

기획자는 소스코드의 위치나 컴포넌트 이름을 알 필요가 없다.

기획자의 작업은 다음 수준으로 제한한다.

> 게임을 본다 → 수정할 대상을 클릭한다 → 원하는 변경사항을 자연어로 작성한다.

이후 과정은 시스템이 자동으로 처리한다.

```text
Designer Comment
        ↓
Target Identification
        ↓
VisualTask
        ↓
Task Gateway
        ↓
Codex App Server
        ↓
Codex Skill
        ↓
Subagents
        ↓
Code Modification
        ↓
Verification
        ↓
Vite HMR
        ↓
Designer Review
```

---

# 2. 핵심 사용자 경험

## 2.1 기본 시나리오

기획자가 게임 시작 화면을 보고 있다고 가정한다.

화면에 다음 버튼이 존재한다.

```text
┌────────────────────┐
│                    │
│    MEOW BEYOND     │
│                    │
│     ┌────────┐     │
│     │ START  │     │
│     └────────┘     │
│                    │
└────────────────────┘
```

기획자는 `Comment Mode`를 켠다.

START 버튼에 마우스를 올리면 버튼이 Highlight된다.

```text
┌──────────────┐
│    START     │ ← selected
└──────────────┘
```

버튼을 클릭한 뒤 다음 Comment를 작성한다.

> START 버튼을 지금보다 40px 정도 아래로 내려줘.

Submit하면 시스템은 이를 단순 문자열 Comment가 아니라 `VisualTask`로 변환한다.

Codex는 실제 관련 코드를 수정하고 검증한다.

검증 성공 후 Vite HMR을 통해 화면이 갱신된다.

기획자는 같은 화면에서 수정된 결과를 확인한다.

---

# 3. 시스템의 핵심 원칙

## 3.1 화면 좌표가 아니라 Element Identity를 사용한다

다음 정보만 전달해서는 안 된다.

```json
{
  "x": 843,
  "y": 731,
  "comment": "이거 아래로 내려줘"
}
```

좌표는 대상의 Identity가 아니다.

시스템은 반드시 다음 연결 관계를 갖는다.

```text
Visual Element
      ↓
Inspector ID
      ↓
Runtime Identity
      ↓
Source Identity
```

예:

```text
START Button

↓

start-button

↓

StartButton runtime component

↓

src/game/.../StartButton.ts
```

---

## 3.2 Comment는 반드시 Structured Task로 변환한다

사용자가 작성한 자연어 Comment를 Codex에 직접 전달하지 않는다.

중간 표현으로 `VisualTask`를 생성한다.

```text
Comment
   ↓
VisualTask
   ↓
Codex
```

---

## 3.3 Codex는 바로 코드를 수정하지 않는다

Codex workflow는 다음 순서를 강제한다.

```text
Validate
↓
Resolve Context
↓
Plan
↓
Implement
↓
Verify
↓
Apply
```

---

## 3.4 수정 성공 조건은 코드 변경이 아니다

다음 상태는 성공으로 간주하지 않는다.

```text
Code modified
```

성공은 최소 다음 조건을 만족해야 한다.

```text
Code modified
+
Typecheck passed
+
Relevant tests passed
+
Diff reviewed
```

가능하면 향후:

```text
+
Visual verification passed
```

까지 포함한다.

---

# 4. 전체 Architecture

```text
┌────────────────────────────────────────────────────────────┐
│                     DESIGNER BROWSER                       │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Review Wrapper / Editor                  │  │
│  │                                                      │  │
│  │   ┌──────────────────────────────────────────────┐   │  │
│  │   │               Game Runtime                   │   │  │
│  │   │                                              │   │  │
│  │   │     UI / Canvas / Game Objects              │   │  │
│  │   │                                              │   │  │
│  │   └───────────────────┬──────────────────────────┘   │  │
│  │                       │                              │  │
│  │              Inspector Bridge                       │  │
│  │                       │                              │  │
│  │            postMessage Protocol                     │  │
│  │                       │                              │  │
│  │               Inspector Overlay                     │  │
│  │               Comment Composer                      │  │
│  │               Task Status UI                        │  │
│  └───────────────────────┬──────────────────────────────┘  │
└──────────────────────────┼─────────────────────────────────┘
                           │
                           │ HTTP / WebSocket
                           ▼
┌────────────────────────────────────────────────────────────┐
│                 LOCAL TASK GATEWAY                         │
│                                                            │
│  VisualTask Validation                                     │
│  Git State Validation                                      │
│  Task Persistence                                          │
│  Codex App Server Adapter                                  │
│  Event Streaming                                           │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           │ JSON-RPC
                           ▼
┌────────────────────────────────────────────────────────────┐
│                    CODEX APP SERVER                        │
│                                                            │
│                     thread/start                           │
│                          ↓                                 │
│                      turn/start                            │
│                          ↓                                 │
│                $game-comment-flow                          │
│                          ↓                                 │
│                     Orchestrator                           │
│                          │                                 │
│            ┌─────────────┼─────────────┐                   │
│            ▼             ▼             ▼                   │
│        Context       Implementation   Verification          │
│         Agent            Agent           Agent              │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
                  Local Git Workspace
                           │
                           ▼
                 typecheck / tests
                           │
                           ▼
                       Vite HMR
                           │
                           ▼
                    Review Wrapper
```

---

# 5. Component Specification

## 5.1 Review Wrapper

### 책임

기획자가 직접 사용하는 frontend application.

주요 책임:

- Game Live 화면 렌더링
- Comment Mode On/Off
- Hover Highlight
- Element Selection
- Comment 작성
- VisualTask 생성
- Task 제출
- Task 진행 상태 표시
- 수정 완료 결과 표시

기존 프로젝트에는 `src/editor`가 별도 구성되어 있으므로 Review Wrapper는 해당 editor application을 확장하는 형태로 구성한다. 현재 프로젝트 역시 `game`과 `editor` 빌드를 별도로 제공한다.

### 권장 구조

```text
src/editor/review/

├── reviewApp.ts
├── reviewStore.ts
├── bridgeClient.ts
├── inspectorOverlay.ts
├── commentComposer.ts
├── taskClient.ts
├── taskPanel.ts
├── types.ts
└── review.css
```

---

# 6. Inspector Bridge

## 6.1 필요성

Wrapper에서 다음처럼 Game Live를 iframe으로 렌더링할 수 있다.

```html
<iframe src="https://live.game.jeongrae.me" />
```

그러나 Wrapper와 Game Live의 Origin이 다르면 Same-Origin Policy에 의해 iframe 내부 DOM을 직접 탐색할 수 없다.

따라서 다음 구조를 사용한다.

```text
Wrapper
   ↕
postMessage
   ↕
Inspector Bridge
   ↓
Game Runtime
```

Inspector 작업은 Game Runtime 내부에서 수행한다.

---

## 6.2 위치

```text
src/game/inspector/

├── bridge.ts
├── registry.ts
├── types.ts
└── adapters/
    ├── domAdapter.ts
    ├── canvasAdapter.ts
    └── mapAdapter.ts
```

---

# 7. Inspectable Target

게임에서 Comment가 가능한 모든 대상은 `Inspectable Target`으로 표현한다.

```ts
type InspectorTargetKind = "dom" | "game-object" | "map-cell";
```

기본 형태:

```ts
interface InspectorTarget {
  id: string;

  kind: "dom" | "game-object" | "map-cell";

  label?: string;

  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  source?: {
    file?: string;
    symbol?: string;
  };

  runtime?: Record<string, unknown>;
}
```

---

# 8. DOM Element Inspection

가능한 DOM UI에는 stable ID를 지정한다.

예:

```html
<button data-inspector-id="start-button" data-inspector-kind="dom" data-inspector-label="START">
  START
</button>
```

Inspector Bridge가 해당 Element를 선택하면:

```json
{
  "id": "start-button",
  "kind": "dom",
  "label": "START"
}
```

를 생성한다.

---

# 9. Inspector Registry

더 정확한 코드 mapping이 필요하면 registry를 사용한다.

```ts
registerInspectable({
  id: "start-button",

  kind: "dom",

  source: {
    file: "src/game/ui/startScreen.ts",
    symbol: "StartButton",
  },
});
```

목표:

```text
Rendered Element
      ↓
Inspector ID
      ↓
Source File
      ↓
Source Symbol
```

---

# 10. Game Object Inspection

게임의 모든 객체가 DOM Element인 것은 아니다.

Canvas 또는 WebGL 기반 객체도 동일한 Target protocol을 사용한다.

예:

```json
{
  "id": "wall:12:4",

  "kind": "game-object",

  "runtime": {
    "objectType": "Wall",
    "position": {
      "x": 12,
      "y": 4
    }
  },

  "source": {
    "file": "src/game/features/fields/wall/presentation.ts"
  }
}
```

이 구조를 통해 기획자가 특정 Wall instance를 선택할 수 있다.

---

# 11. VisualTask Specification

VisualTask는 Wrapper와 Backend 사이의 핵심 Contract다.

```ts
interface VisualTask {
  id: string;

  createdAt: string;

  instruction: string;

  target: InspectorTarget;

  page: {
    url: string;

    viewport: {
      width: number;
      height: number;
    };
  };

  repository: {
    gitSha?: string;
  };

  evidence?: {
    screenshot?: string;
    crop?: string;
  };
}
```

---

# 12. VisualTask Example

```json
{
  "id": "visual-0182",

  "createdAt": "2026-08-25T14:30:00Z",

  "instruction": "START 버튼을 지금보다 40px 아래로 내려줘.",

  "target": {
    "id": "start-button",

    "kind": "dom",

    "label": "START",

    "bounds": {
      "x": 812,
      "y": 740,
      "width": 296,
      "height": 84
    },

    "source": {
      "file": "src/game/ui/startScreen.ts",
      "symbol": "StartButton"
    }
  },

  "page": {
    "url": "http://localhost:5173/",

    "viewport": {
      "width": 1920,
      "height": 1080
    }
  },

  "repository": {
    "gitSha": "abc123"
  }
}
```

---

# 13. Git SHA Validation

VisualTask에는 가능한 경우 현재 화면 build의 Git SHA를 포함한다.

이유:

```text
Designer가 보고 있는 코드
        ≠
Codex가 수정할 코드
```

상태를 방지하기 위함.

Task 처리 전:

```text
VisualTask.gitSha
        =
Local Workspace HEAD
```

를 검사한다.

다르면 다음 중 하나를 수행한다.

```text
resolve safely
```

또는:

```text
NEEDS_HUMAN
```

---

# 14. Local Task Gateway

## 책임

Wrapper와 Codex App Server 사이의 중간 계층.

```text
tools/review-server/

├── server.ts
├── taskSchema.ts
├── taskStore.ts
├── gitContext.ts
├── codexClient.ts
└── eventStream.ts
```

---

# 15. API

## Create Task

```http
POST /api/tasks
```

Input:

```json
VisualTask
```

Response:

```json
{
  "taskId": "visual-0182",
  "status": "queued"
}
```

---

## Read Task

```http
GET /api/tasks/:id
```

---

## Event Stream

권장:

```text
WebSocket
/api/events
```

또는:

```text
Server-Sent Events
/api/tasks/:id/events
```

---

# 16. Task State Machine

```text
DRAFT
  ↓
SUBMITTED
  ↓
VALIDATING
  ↓
QUEUED
  ↓
RESOLVING_CONTEXT
  ↓
PLANNING
  ↓
IMPLEMENTING
  ↓
VERIFYING
  ↓
APPLIED
```

Failure states:

```text
VALIDATION_FAILED

IMPLEMENTATION_FAILED

VERIFICATION_FAILED

NEEDS_HUMAN
```

---

# 17. Designer UI Status

Codex 내부의 복잡한 로그를 그대로 기획자에게 노출하지 않는다.

기획자 UI에서는:

```text
● Submitted

● Inspecting

● Editing

● Testing

✓ Applied
```

정도로 추상화한다.

실패:

```text
✕ Failed

Needs developer review
```

---

# 18. Codex App Server Integration

Task Gateway가 Codex execution session을 생성한다.

Conceptual sequence:

```text
Codex App Server
      ↓
initialize
      ↓
thread/start
      ↓
turn/start
```

Working directory:

```text
/path/to/oai-builder
```

Turn input:

```text
$game-comment-flow

Execute visual task visual-0182.

VisualTask:
...
```

---

# 19. Codex Skill

Skill 이름:

```text
game-comment-flow
```

권장 위치:

```text
.agents/
└── skills/
    └── game-comment-flow/
        ├── SKILL.md
        ├── agents/
        │   └── openai.yaml
        ├── references/
        │   ├── visual-task.md
        │   ├── architecture.md
        │   └── verification.md
        └── scripts/
```

---

# 20. `game-comment-flow` Workflow

```text
VisualTask
     ↓
Validate
     ↓
Resolve Target
     ↓
Inspect Source
     ↓
Plan
     ↓
Delegate
     ↓
Implement
     ↓
Verify
     ↓
Review Diff
     ↓
Result
```

---

# 21. Subagent Specification

초기 버전은 3개 Agent로 제한한다.

## Context Agent

책임:

- VisualTarget 분석
- Source mapping 확인
- 관련 코드 탐색
- 영향 범위 분석

원칙:

```text
Read Only
```

---

## Implementation Agent

책임:

- 실제 코드 수정
- 최소 파일 수정
- 기존 architecture 유지

원칙:

```text
Smallest Coherent Patch
```

---

## Verification Agent

책임:

- diff 독립 검토
- TypeScript validation
- test 실행
- regression 가능성 확인

원칙:

```text
Implementation Agent의 성공 주장에 의존하지 않음
```

---

# 22. AGENTS.md와 Skill 역할 분리

현재 프로젝트의 `AGENTS.md`에는 asset 처리, project command, import 규칙 등이 이미 정의되어 있다.

역할:

```text
AGENTS.md
=
이 repository에서
어떻게 개발해야 하는가
```

```text
game-comment-flow
=
VisualTask를
어떤 절차로 처리해야 하는가
```

중복 규칙을 두지 않는다.

---

# 23. Verification Policy

현재 프로젝트는 이미 다음 script를 제공한다.

```text
typecheck
test
test:run
build
build:live
build:editor
```

Codex는 임의 command를 먼저 만들지 않고 existing project scripts를 사용한다.

최소 검증:

```bash
pnpm run typecheck
```

관련 테스트:

```bash
pnpm run test:run
```

Entry / build 관련 변경이라면:

```bash
pnpm run build:live
```

또는:

```bash
pnpm run build:editor
```

---

# 24. Apply Strategy

V1에서는 하나의 Active Workspace를 사용한다.

```text
Task A
 ↓
Local Workspace 수정
 ↓
Verify
 ↓
HMR
 ↓
Designer Review
```

Task A 완료 전 Task B의 destructive 수정은 실행하지 않는다.

초기 버전에서는 병렬 Worktree 기반 적용을 하지 않는다.

이유:

Vite Dev Server와 Codex가 다른 Worktree를 보고 있으면 변경사항이 즉시 Designer 화면에 반영되지 않을 수 있기 때문이다.

---

# 25. HMR Feedback Loop

완성된 loop:

```text
Designer
   ↓
Select Element
   ↓
Comment
   ↓
VisualTask
   ↓
Codex
   ↓
Code Change
   ↓
Verification
   ↓
Vite HMR
   ↓
Game Reload
   ↓
Designer
```

이 loop가 본 시스템의 핵심 제품 가치다.

---

# 26. V1 Scope

V1에서 반드시 구현한다.

- [ ] Game Live Wrapper
- [ ] Comment Mode
- [ ] DOM Target selection
- [ ] Inspector Bridge
- [ ] Stable Inspector ID
- [ ] VisualTask 생성
- [ ] Local Task Gateway
- [ ] Task validation
- [ ] Codex Skill
- [ ] Codex App Server 연결
- [ ] Single task execution
- [ ] Local source modification
- [ ] Typecheck
- [ ] Test
- [ ] HMR feedback
- [ ] Task status UI

---

# 27. V1에서 제외

초기 버전에서 다음은 필수 범위가 아니다.

- 다중 사용자 실시간 comment
- GitHub PR 자동 생성
- 여러 Task 병렬 실행
- Branch / Worktree 자동 관리
- Visual regression AI
- Screenshot diff scoring
- Undo from Designer UI
- Agent별 상세 로그 UI
- 승인 workflow
- production 서버 직접 수정
- autonomous deployment

---

# 28. V1 Acceptance Criteria

다음 시나리오가 성공하면 V1을 완료한 것으로 판단한다.

### Test Scenario

1. Local game server 실행.
2. Review Wrapper 실행.
3. 기획자가 Comment Mode 활성화.
4. START 버튼 Hover.
5. START 버튼 Highlight.
6. START 버튼 클릭.
7. Inspector target 정보 표시.
8. Comment 입력.

```text
START 버튼을 아래로 내려줘.
```

9. Submit.
10. VisualTask 생성.
11. Gateway가 Task를 검증.
12. Codex App Server가 Task를 수신.
13. `$game-comment-flow` 실행.
14. 관련 코드 탐색.
15. 실제 source 수정.
16. `pnpm run typecheck` 성공.
17. relevant test 성공.
18. Vite HMR 수행.
19. Wrapper 화면에서 START 버튼 위치 변경 확인.
20. Task 상태가 `APPLIED`로 변경.

---

# 29. 최종 Definition of Done

```text
Designer가
코드를 열지 않고

게임 화면에서
하나의 Element를 선택하고

자연어 Comment를 남긴 뒤

실제 Local Source Code가 수정되고

검증을 통과하고

동일한 게임 화면에서
변경 결과를 확인할 수 있다.
```

이 조건을 만족하면 첫 번째 완전한 Visual Game Development Flow가 완성된 것으로 정의한다.

---

# 30. 최종 Architecture Summary

```text
                    DESIGNER

                       │
                       ▼

              Review Wrapper

                       │
                       ▼

              Inspector Bridge

                       │
                       ▼

                 VisualTask

                       │
                       ▼

             Local Task Gateway

                       │
                       ▼

              Codex App Server

                       │
                       ▼

             $game-comment-flow

                       │

          ┌────────────┼────────────┐
          │            │            │

          ▼            ▼            ▼

       Context     Implementation  Verification
        Agent          Agent          Agent

          └────────────┬────────────┘

                       ▼

              Local Repository

                       │
                       ▼

             typecheck / tests

                       │
                       ▼

                  Vite HMR

                       │
                       ▼

                Game Runtime

                       │
                       └──────────────→ DESIGNER
```

## Product Definition

> **게임 화면 자체를 개발 인터페이스로 사용한다.**

기획자는 화면을 보고 수정할 곳을 지목한다.

Inspector는 그 대상을 코드와 연결한다.

Codex는 해당 요청을 분석·수정·검증한다.

그리고 수정 결과가 다시 동일한 화면으로 돌아온다.

즉,

**Figma Comment × Runtime Inspector × Codex Agentic Coding**

을 하나의 Game Development Loop로 결합하는 시스템이다.
