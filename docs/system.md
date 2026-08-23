# System Design

## Technology

- Language: TypeScript
- Build tool: Vite
- Game renderer: DOM, CSS, and inline SVG
- State store: Zustand vanilla (`zustand/vanilla`)
- React and a physics engine are not used.

## Responsibilities

```text
Zustand: confirmed game state and commands
DOM scene controllers: lifecycle, input, assets, animation, rendering
```

- DOM nodes, keyboard handlers, and timers must never be stored in Zustand.
- The game view keeps an `EntityId -> HTMLImageElement` mapping and synchronizes it from the store.
- A game-scene subscription is disposed when its controller is disposed.
- The game app and editor app have independent HTML and TypeScript entry points.
- The game app never imports editor-only modules. The editor reuses the game domain and Zustand command pipeline for inline live tests.
- Object and field feature modules own their pure rules and presentation metadata. Runtime state remains serializable plain data and stores only each object's `kind`.
- The central decider coordinates interactions that depend on multiple objects, fields, or the complete board state; entities never call each other directly.
- Game scene controllers and `editorApp` resolve labels, asset slots, and texture URLs through the shared feature presentation catalog.

## Applications and deployment

```text
apps/game    -> dist/game    -> game subdomain
apps/editor  -> dist/editor  -> editor subdomain
```

- `npm run dev:game` and `npm run dev:editor` start each app independently.
- `npm run build:game` and `npm run build:editor` create independently deployable artifacts.
- `npm run build` type-checks the repository and builds both artifacts.

## Domain model

- All logical positions use tile coordinates (`{ x, y }`); the DOM board maps them to CSS-grid cells for rendering.
- The exit is represented as a tile rather than an entity, so an entity may occupy it.
- `Player`, `Normal`, `Anchor`, and `Swapper` are entities with an `EntityId`, tile position, and owned direction controls.
- Each direction control has exactly one owner. The player owns all four controls at game start.
- `blank`, `floor`, `wall`, `exit`, and `plate` are tile kinds. `blank` represents map-exterior space without a rendered tile and rejects entry as `out-of-bounds`. Plates are stored as `inactive` or `active` by tile coordinate.
- Entities are held in `Record<EntityId, Entity>`.
- Entities do not call each other directly. Board interactions are decided centrally from the complete state.
- A versioned `MapDocument` is the shared, editable level definition. It contains dimensions, tiles, and initial object positions but no mutable play state.
- When an editor draft becomes valid, the editor creates a game store from its `MapDocument` and renders that state in the same cell grid used for placement.
- Direction keys dispatch commands to the editor's test game store. Movement during a test never changes the editor draft, and the next map edit recreates the test store from the changed draft.
- The editor cell grid and tool palette load the same tile, player, normal object, goal, and control-arrow assets as the game runtime. Field states and special object kinds add overlays where dedicated assets do not exist.
- Version 1 `.map` files are UTF-8 JSON documents with `version`, `columns`, `rows`, `tiles`, and `objects` keys.

## State transition

State changes use the decider pattern.

```text
GameCommand + GameState -> decide -> GameEvent[] -> evolve -> next GameState
```

- `player/move` is the initial command.
- `entity/moved`, `control/transferred`, `plate/activated`, `plate/deactivated`, `goal/opened`, and `game/completed` are the initial domain events.
- A blocked movement produces no event and returns a rejection reason (`out-of-bounds` or `wall`).
- Moving into a normal object keeps both positions unchanged and transfers the used direction control to that object. A normal object activates plates, gives its used control to an empty anchor or receives a populated anchor's full control set on contact, and swaps its full control set with a swapper on contact.
- All events from one command are evolved before Zustand receives a single state update; observers never see intermediate movement state.

```text
keyboard input
-> game controller creates a command
-> gameStore.dispatch(command)
-> decide / evolve
-> Zustand update
-> DOM view synchronizes images and ownership arrows
```

## Module layout

```text
apps/
├─ game/
│  ├─ index.html
│  └─ main.ts
└─ editor/
   ├─ index.html
   └─ main.ts

src/
├─ map/
│  └─ mapDocument.ts
├─ editor/
│  ├─ main.ts
│  ├─ editorApp.ts
│  ├─ editorStore.ts
│  └─ mapFiles.ts
└─ game/
   ├─ main.ts
   ├─ domain/
   │  ├─ types.ts
   │  ├─ level.ts
   │  └─ decider.ts
   ├─ features/
   │  ├─ fields/<kind>/{rules,presentation}.ts
   │  ├─ objects/<kind>/{rules,presentation}.ts
   │  ├─ rules.ts
   │  └─ presentation.ts
   ├─ store/
   │  └─ gameStore.ts
   └─ scenes/
      └─ <scene>/{controller,view,scene.module.css}
```

## Testing

- Use Vitest through its CLI for automated tests.
- Tests describe observable behavior, not implementation details.
- Test names are Korean sentences.
- Test the domain and store: movement outcomes, box interactions, emitted events, and state transitions.
- Do not test rendering asset paths, asset file names, sprite construction details, or animation frame metadata.
- Verify DOM scene integration with the production build and manual browser checks.

## Asset conversion

- Unscaled assets omit a size facet; generated assets use `<name>.size-<width>x<height>.webp` (for example, `tile.webp` and `tile.size-96x96.webp`).
- The conversion script supports `32`, `36`, `48`, `64`, and `96` pixels: `pnpm run asset:resize -- assets/playable/playable.size-1254x1254.webp 96`.
- A source must be a `1254×1254` image. The script crops equal pixels from all four sides to obtain a size divisible by the target, then applies nearest-neighbor scaling.
- New and replaced images are trimmed at alpha threshold 1 and encoded as WebP.
- Generated files are never overwritten unless `--force` is supplied.
- The default runtime asset size is `96`; the DOM board loads the corresponding runtime assets.

## Deferred decisions

- The final win condition beyond the documented player-arrives-at-exit animation.
- Dedicated wall, plate, anchor, and swapper art assets, and solvable map validation.
- Movement tweening, sound, undo/redo, level progression, and persistent event history.
