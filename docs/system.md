# System Design

## Technology

- Language: TypeScript
- Build tool: Vite
- Game framework: Phaser
- State store: Zustand vanilla (`zustand/vanilla`)
- React and a physics engine are not used.

## Responsibilities

```text
Zustand: confirmed game state and commands
Phaser: Scene lifecycle, input, assets, sprites, animation, rendering
```

- Phaser objects such as sprites, keyboard handlers, and tweens must never be stored in Zustand.
- `GameScene` keeps an `EntityId -> Phaser Sprite` mapping and synchronizes sprites from the store.
- A `GameScene` subscription is disposed when the scene shuts down.

## Domain model

- All logical positions use tile coordinates (`{ x, y }`); Phaser converts them to pixel coordinates for rendering.
- The exit is represented as a tile rather than an entity, so an entity may occupy it.
- `Player` and `Box` are entities with an `EntityId` and tile position.
- `floor`, `wall`, and `exit` are tile kinds.
- Entities are held in `Record<EntityId, Entity>`.
- Entities do not call each other directly. Board interactions are decided centrally from the complete state.

## State transition

State changes use the decider pattern.

```text
GameCommand + GameState -> decide -> GameEvent[] -> evolve -> next GameState
```

- `player/move` is the initial command.
- `player/moved`, `box/pushed`, `gate/opened`, and `game/completed` are the initial domain events.
- A blocked movement produces no event and returns a rejection reason (`out-of-bounds`, `wall`, or `blocked-box`).
- A valid box push produces both the box and player movement events.
- All events from one command are evolved before Zustand receives a single state update; observers never see intermediate movement state.

```text
keyboard input
-> GameScene creates a command
-> gameStore.dispatch(command)
-> decide / evolve
-> Zustand update
-> GameScene synchronizes sprites
```

## Module layout

```text
src/
├─ main.ts
└─ game/
   ├─ domain/
   │  ├─ types.ts
   │  ├─ level.ts
   │  └─ decider.ts
   ├─ store/
   │  └─ gameStore.ts
   └─ scenes/
      └─ GameScene.ts
```

## Testing

- Use Vitest through its CLI for automated tests.
- Tests describe observable behavior, not implementation details.
- Test names are Korean sentences.
- Test the domain and store: movement outcomes, box interactions, emitted events, and state transitions.
- Do not test rendering asset paths, asset file names, sprite construction details, or animation frame metadata.
- Verify Phaser integration with the production build and manual browser checks.

## Asset conversion

- 1254px original assets use `<name>.1254.png`; generated assets use `<name>.<size>.png` (for example, `tile.1254.png` and `tile.96.png`).
- The conversion script supports `32`, `36`, `48`, `64`, and `96` pixels: `npm run asset:resize -- assets/tail/tile.1254.png 96`.
- A source must be a `1254×1254` image. The script crops equal pixels from all four sides to obtain a size divisible by the target, then applies nearest-neighbor scaling.
- Generated files are never overwritten unless `--force` is supplied.
- The default runtime asset size is `96`; `GameScene` loads the corresponding `.96.png` files.

## Deferred decisions

- The final win condition beyond the documented player-arrives-at-exit animation.
- Wall rendering, level data, and solvable box placement.
- Movement tweening, sound, undo/redo, level progression, and persistent event history.
