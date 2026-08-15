# System Design

## Technology

- Language: TypeScript
- Build tool: Vite
- Game framework: Phaser
- State store: Zustand vanilla (`zustand/vanilla`)
- React and a physics engine are not used.

## Game model

- The game is a tile-based 2D Sokoban game; one tile is `36 x 36` pixels.
- The player starts in the bottom-left tile, five boxes are placed at distinct random positions, and the exit is in the top-right tile.
- The exit is a tile, not an entity. A player or box may occupy it.
- The exit animation has four frames and plays sequentially from frame 1 to 4 when the player reaches it.
- All logical positions use tile coordinates (`{ x, y }`); Phaser converts them to pixel coordinates for rendering.

## Responsibilities

```text
Zustand: confirmed game state and commands
Phaser: Scene lifecycle, input, assets, sprites, animation, rendering
```

- Phaser objects such as sprites, keyboard handlers, and tweens must never be stored in Zustand.
- `GameScene` keeps an `EntityId -> Phaser Sprite` mapping and synchronizes sprites from the store.
- A `GameScene` subscription is disposed when the scene shuts down.

## Domain model

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
- `player/moved`, `box/pushed`, and `game/completed` are the initial domain events.
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

## Deferred decisions

- Whether `10 x 20` means 10 columns by 20 rows or 20 columns by 10 rows.
- The final win condition beyond the documented player-arrives-at-exit animation.
- Walls, goal tiles, level data, and solvable box placement.
- Movement tweening, sound, undo/redo, level progression, and persistent event history.
