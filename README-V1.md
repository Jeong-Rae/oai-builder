# Visual Comment Flow V1

This bundle is an additive implementation scaffold for `Jeong-Rae/oai-builder`.

## What works in V1

1. A game-side Inspector Bridge communicates with a wrapper over `postMessage`.
2. The wrapper can enable Comment mode, hover/select inspectable elements, write a comment, and generate a `VisualTask`.
3. A Task Processor validates and queues the task, then creates a read-only Markdown intake.
4. A separate Worker process leases the job and clones the exact Git commit into an isolated checkout.
5. Codex modifies only that checkout; the Worker independently runs typecheck and the game build.
6. The Processor exposes progress and a temporary preview URL through the task API.

## Current boundary

The local implementation uses separate Task Processor and Worker processes on one machine. Their
contract is HTTP-based so the Worker can move to another node later. The original VT workspace is
never modified: each job uses a detached clone at the submitted full Git SHA. Preview publishing is
currently a fake URL adapter and does not deploy the modified build.

## Integration status

### Game runtime

Done. `src/game/main.ts` boots `installInspectorBridge()` alongside `GameApp`.

### Review wrapper

Done. The review console is a dedicated Vite app (`vite.review.config.ts`, port `5175`) rooted at `apps/review`, mounting `mountReviewApp()` from `src/editor/review/`.

### Inspectable elements

Add stable identities to elements that designers should be able to comment on, for example:

```html
<button data-inspector-id="start-button" data-inspector-kind="dom" data-inspector-label="START">
  START
</button>
```

For richer code mapping, register them with `registerInspectable()`.

## Local run

Whole stack (processor + worker + game + review console):

```bash
pnpm run dev:vt
```

`dev:vt` runs the game and review servers in `vt` mode. Their optimized dependency caches are
isolated under `node_modules/.vite-vt/game` and `node_modules/.vite-vt/review`, so the two dev
servers cannot overwrite each other's pre-bundled dependencies. Other dev commands keep Vite's
default cache location.

Review console: `http://localhost:5175/`

Task Processor and Worker separately:

```bash
VT_WORKER_TOKEN=<shared-secret> pnpm run review:processor
VT_WORKER_TOKEN=<shared-secret> \
VT_REPOSITORY_URL=https://github.com/Jeong-Rae/oai-builder.git \
pnpm run review:worker
```

Expected endpoint:

- `GET http://127.0.0.1:8787/health`
- `POST http://127.0.0.1:8787/api/tasks`
- `GET http://127.0.0.1:8787/api/tasks/:id`

Both processes start their own local `codex app-server` and use the existing local Codex login. The
Processor accepts multiple tasks into an in-memory FIFO. Intake is sequential, and the Worker leases
one modification job at a time. `dev:vt` creates a shared worker token, uses the current repository path,
and injects the current Git SHA/dirty state into the Review app automatically.

Tasks move through `queued → reviewing → ready → editing → verifying → completed`. A clean full Git
SHA is required. Successful Worker turns must also pass `pnpm run typecheck` and
`pnpm run build:live`; the returned preview URL uses `https://preview.invalid` unless
`VT_FAKE_PREVIEW_BASE_URL` is configured.

The review wrapper resolves the game server as a sibling port from its own origin:

- game dev server: same host on port `5173`
- task processor: same-origin `/api/tasks`, proxied by the review dev server to `127.0.0.1:8787`

`VITE_REVIEW_GAME_URL` / `VITE_REVIEW_GATEWAY_URL` can override both.

The same-origin task proxy keeps the Codespaces `8787` forwarded port private. Accessing that
private port directly from browser JavaScript can fail at the Codespaces tunnel authentication
layer before the gateway can return its own CORS headers.

## Important browser constraint

The wrapper must not attempt to inspect a cross-origin iframe DOM directly. The game runtime performs inspection internally and sends only structured target metadata to the wrapper through `postMessage`.
