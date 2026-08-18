import type { MapDocument } from '../../map/mapDocument';
import type { Entity, GameState, Normal, Position, TileKind } from './types';
import { createPlateStates } from '../features/fields/plate/rules';
import { objectRules } from '../features/rules';

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
    normals[id] = { id, kind: 'normal', position: available[index], controls: [...objectRules.normal.initialControls] };
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
        controls: [...objectRules.player.initialControls],
      },
      ...createNormals(boxCount, random),
    },
    playerId: 'player',
    plateStates: createPlateStates(tiles),
    goalOpened: false,
    status: 'playing',
  };
}

export function createGameStateFromMap(map: MapDocument): GameState {
  const entities: Record<string, Entity> = {};

  for (const object of map.objects) {
    const controls = objectRules[object.kind].initialControls;
    const entity = {
      id: objectRules[object.kind].fixedId?.value ?? object.id,
      kind: object.kind,
      position: { ...object.position },
      controls: [...controls],
    } as Entity;

    entities[entity.id] = entity;
  }

  return {
    columns: map.columns,
    rows: map.rows,
    tiles: map.tiles.map((row) => [...row]),
    entities,
    playerId: 'player',
    plateStates: createPlateStates(map.tiles),
    goalOpened: false,
    status: 'playing',
  };
}
