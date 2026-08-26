# Visual Comment Flow V1

This bundle is an additive implementation scaffold for `Jeong-Rae/oai-builder`.

## What works in V1

1. A game-side Inspector Bridge communicates with a wrapper over `postMessage`.
2. The wrapper can enable Comment mode, hover/select inspectable elements, write a comment, and generate a `VisualTask`.
3. A local Node Task Gateway validates the task and converts it into a deterministic `$game-comment-flow` Codex prompt.
4. A repo-scoped Codex skill lives at `.agents/skills/game-comment-flow`.
5. The skill defines validation → context resolution → implementation → verification → result.

## Intentional V1 boundary

The gateway does **not yet open a Codex App Server thread/turn automatically**. It emits the exact prompt payload that the App Server adapter should send next.

That boundary is intentional because App Server process/auth/transport integration should be implemented and tested in the developer's actual local Codex environment.

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

Review console: `http://localhost:5175/`

Task gateway only:

```bash
pnpm run review:server
```

Expected endpoint:

- `GET http://127.0.0.1:8787/health`
- `POST http://127.0.0.1:8787/api/tasks`

The review wrapper resolves sibling ports from its own origin (works on localhost and Codespaces forwarded HTTPS hosts):

- game dev server: same host on port `5173`
- task gateway: same host on port `8787`

`VITE_REVIEW_GAME_URL` / `VITE_REVIEW_GATEWAY_URL` can override both.

## Important browser constraint

The wrapper must not attempt to inspect a cross-origin iframe DOM directly. The game runtime performs inspection internally and sends only structured target metadata to the wrapper through `postMessage`.
