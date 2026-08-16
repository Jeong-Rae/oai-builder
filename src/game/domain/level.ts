import type { GameState, Normal, Position, TileKind } from './types';

export const BOARD_COLUMNS = 9;
export const BOARD_ROWS = 9;
export const TILE_SIZE = 96;
const DEFAULT_BOX_COUNT = 5;

export interface InitialStateOptions {
  boxCount?: number;
  random?: () => number;
  tileOverrides?: Array<{ position: Position; kind: TileKind }>;
}

function createTiles(tileOverrides: InitialStateOptions['tileOverrides'] = []): TileKind[][] {
  const tiles: TileKind[][] = Array.from({ length: BOARD_ROWS }, (_, y) =>
    Array.from({ length: BOARD_COLUMNS }, (_, x) =>
      x === BOARD_COLUMNS - 1 && y === 0 ? 'exit' : 'floor',
    ),
  );

  for (const { position, kind } of tileOverrides) {
    tiles[position.y][position.x] = kind;
  }

  return tiles;
}

function createNormals(boxCount: number, random: () => number): Record<string, Normal> {
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

  const normals: Record<string, Normal> = {};

  for (let index = 0; index < boxCount; index += 1) {
    const remaining = available.length - index;
    const offset = Math.min(remaining - 1, Math.floor(random() * remaining));
    const selected = index + offset;
    [available[index], available[selected]] = [available[selected], available[index]];

    const id = `normal-${index + 1}`;
    normals[id] = { id, kind: 'normal', position: available[index], controls: [] };
  }

  return normals;
}

export function createInitialState({
  boxCount = DEFAULT_BOX_COUNT,
  random = Math.random,
  tileOverrides,
}: InitialStateOptions = {}): GameState {
  const tiles = createTiles(tileOverrides);

  return {
    columns: BOARD_COLUMNS,
    rows: BOARD_ROWS,
    tiles,
    entities: {
      player: {
        id: 'player',
        kind: 'player',
        position: { x: 0, y: BOARD_ROWS - 1 },
        controls: ['up', 'down', 'left', 'right'],
      },
      ...createNormals(boxCount, random),
    },
    playerId: 'player',
    plateStates: Object.fromEntries(
      tiles.flatMap((row, y) =>
        row.flatMap((tile, x) => (tile === 'plate' ? [[`${x},${y}`, 'inactive']] : [])),
      ),
    ),
    goalOpened: false,
    status: 'playing',
  };
}
