# Visual Comment Flow V1

This bundle is an additive implementation scaffold for `Jeong-Rae/oai-builder`.

## What works in V1

1. A game-side Inspector Bridge communicates with a wrapper over `postMessage`.
2. The wrapper can enable Comment mode, hover/select inspectable elements, write a comment, and generate a `VisualTask`.
3. A local Node Task Gateway validates the task and submits it to Codex App Server over stdio JSONL.
4. Codex organizes the request into a read-only Markdown response.
5. The gateway stores the response at `task/<task-id>.md` and exposes progress through the task API.

## Current boundary

Codex App Server runs with a read-only sandbox and does not modify game source in this version. The
gateway is the only component that writes the generated Task Markdown. Code implementation and
verification remain a later workflow stage even though the VP progress label retains `코드 수정 중`.

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

Whole stack (gateway + game + review console):

```bash
pnpm run dev:vt
```

`dev:vt` runs the game and review servers in `vt` mode. Their optimized dependency caches are
isolated under `node_modules/.vite-vt/game` and `node_modules/.vite-vt/review`, so the two dev
servers cannot overwrite each other's pre-bundled dependencies. Other dev commands keep Vite's
default cache location.

Review console: `http://localhost:5175/`

Task gateway only:

```bash
pnpm run review:server
```

Expected endpoint:

- `GET http://127.0.0.1:8787/health`
- `POST http://127.0.0.1:8787/api/tasks`
- `GET http://127.0.0.1:8787/api/tasks/:id`

The gateway starts `codex app-server` automatically and uses the existing local Codex login. A POST
returns after the App Server accepts the thread and turn. The review console then polls the Task GET
endpoint until the Markdown is saved or the turn fails. Only one Task is active at a time.

The review wrapper resolves the game server as a sibling port from its own origin:

- game dev server: same host on port `5173`
- task gateway: same-origin `/api/tasks`, proxied by the review dev server to `127.0.0.1:8787`

`VITE_REVIEW_GAME_URL` / `VITE_REVIEW_GATEWAY_URL` can override both.

The same-origin task proxy keeps the Codespaces `8787` forwarded port private. Accessing that
private port directly from browser JavaScript can fail at the Codespaces tunnel authentication
layer before the gateway can return its own CORS headers.

## Important browser constraint

The wrapper must not attempt to inspect a cross-origin iframe DOM directly. The game runtime performs inspection internally and sends only structured target metadata to the wrapper through `postMessage`.
