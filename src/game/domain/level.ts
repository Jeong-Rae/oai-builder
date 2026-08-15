import type { GameState, TileKind } from './types';

export const BOARD_COLUMNS = 10;
export const BOARD_ROWS = 20;

function createTiles(): TileKind[][] {
  return Array.from({ length: BOARD_ROWS }, (_, y) =>
    Array.from({ length: BOARD_COLUMNS }, (_, x) =>
      x === BOARD_COLUMNS - 1 && y === 0 ? 'exit' : 'floor',
    ),
  );
}

export function createInitialState(): GameState {
  return {
    columns: BOARD_COLUMNS,
    rows: BOARD_ROWS,
    tiles: createTiles(),
    entities: {
      player: {
        id: 'player',
        kind: 'player',
        position: { x: 0, y: BOARD_ROWS - 1 },
      },
    },
    playerId: 'player',
  };
}
