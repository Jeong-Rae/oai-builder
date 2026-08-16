import type { Box, GameState, Position, TileKind } from './types';

export const BOARD_COLUMNS = 20;
export const BOARD_ROWS = 10;
export const TILE_SIZE = 36;
const DEFAULT_BOX_COUNT = 5;

export interface InitialStateOptions {
  boxCount?: number;
  random?: () => number;
}

function createTiles(): TileKind[][] {
  return Array.from({ length: BOARD_ROWS }, (_, y) =>
    Array.from({ length: BOARD_COLUMNS }, (_, x) =>
      x === BOARD_COLUMNS - 1 && y === 0 ? 'exit' : 'floor',
    ),
  );
}

function createBoxes(boxCount: number, random: () => number): Record<string, Box> {
  const available: Position[] = [];

  for (let y = 0; y < BOARD_ROWS; y += 1) {
    for (let x = 0; x < BOARD_COLUMNS; x += 1) {
      const isPlayerStart = x === 0 && y === BOARD_ROWS - 1;
      const isExit = x === BOARD_COLUMNS - 1 && y === 0;

      if (!isPlayerStart && !isExit) {
        available.push({ x, y });
      }
    }
  }

  const boxes: Record<string, Box> = {};

  for (let index = 0; index < boxCount; index += 1) {
    const remaining = available.length - index;
    const offset = Math.min(remaining - 1, Math.floor(random() * remaining));
    const selected = index + offset;
    [available[index], available[selected]] = [available[selected], available[index]];

    const id = `box-${index + 1}`;
    boxes[id] = { id, kind: 'box', position: available[index] };
  }

  return boxes;
}

export function createInitialState({
  boxCount = DEFAULT_BOX_COUNT,
  random = Math.random,
}: InitialStateOptions = {}): GameState {
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
      ...createBoxes(boxCount, random),
    },
    playerId: 'player',
    status: 'playing',
  };
}
