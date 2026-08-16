import type { Position, TileKind } from '../game/domain/types';

export const MAP_VERSION = 1 as const;

export type MapObjectKind = 'player' | 'normal' | 'handoff' | 'swapper';

export interface MapObject {
  id: string;
  kind: MapObjectKind;
  position: Position;
}

export interface MapDocument {
  version: typeof MAP_VERSION;
  columns: number;
  rows: number;
  tiles: TileKind[][];
  objects: MapObject[];
}

export interface MapError {
  code: string;
  message: string;
  position?: Position;
}

export type MapResult =
  | { ok: true; map: MapDocument }
  | { ok: false; errors: MapError[] };

const tileKinds: TileKind[] = ['blank', 'floor', 'wall', 'plate', 'exit', 'wormhole', 'gate'];
const objectKinds: MapObjectKind[] = ['player', 'normal', 'handoff', 'swapper'];

export function createBlankMap(columns = 9, rows = 9): MapDocument {
  return {
    version: MAP_VERSION,
    columns,
    rows,
    tiles: Array.from({ length: rows }, () => Array<TileKind>(columns).fill('floor')),
    objects: [],
  };
}

export function cloneMap(map: MapDocument): MapDocument {
  return {
    version: MAP_VERSION,
    columns: map.columns,
    rows: map.rows,
    tiles: map.tiles.map((row) => [...row]),
    objects: map.objects.map((object) => ({
      id: object.id,
      kind: object.kind,
      position: { ...object.position },
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateMap(value: unknown): MapResult {
  if (!isRecord(value)) {
    return { ok: false, errors: [{ code: 'document', message: '맵 문서는 객체여야 합니다.' }] };
  }

  const errors: MapError[] = [];
  const { version, columns, rows, tiles, objects } = value;

  if (version !== MAP_VERSION) {
    errors.push({ code: 'version', message: `지원하지 않는 맵 버전입니다: ${String(version)}` });
  }

  if (!Number.isInteger(columns) || Number(columns) < 1) {
    errors.push({ code: 'columns', message: '열 수는 1 이상의 정수여야 합니다.' });
  }

  if (!Number.isInteger(rows) || Number(rows) < 1) {
    errors.push({ code: 'rows', message: '행 수는 1 이상의 정수여야 합니다.' });
  }

  const validColumns = Number.isInteger(columns) && Number(columns) > 0 ? Number(columns) : 0;
  const validRows = Number.isInteger(rows) && Number(rows) > 0 ? Number(rows) : 0;
  let exitCount = 0;
  let wormholeCount = 0;

  if (!Array.isArray(tiles) || tiles.length !== validRows) {
    errors.push({ code: 'tiles', message: '필드 행 수가 맵의 행 수와 일치해야 합니다.' });
  } else {
    tiles.forEach((row, y) => {
      if (!Array.isArray(row) || row.length !== validColumns) {
        errors.push({ code: 'tiles', message: '필드 열 수가 맵의 열 수와 일치해야 합니다.', position: { x: 0, y } });
        return;
      }

      row.forEach((tile, x) => {
        if (!tileKinds.includes(tile as TileKind)) {
          errors.push({ code: 'tile-kind', message: `지원하지 않는 필드입니다: ${String(tile)}`, position: { x, y } });
        } else if (tile === 'exit') {
          exitCount += 1;
        } else if (tile === 'wormhole') {
          wormholeCount += 1;
        }
      });
    });
  }

  if (exitCount !== 1) {
    errors.push({ code: 'exit-count', message: '골은 정확히 하나여야 합니다.' });
  }

  if (wormholeCount !== 0 && wormholeCount !== 2) {
    errors.push({ code: 'wormhole-count', message: '웜홀은 사용하지 않거나 정확히 두 개여야 합니다.' });
  }

  let playerCount = 0;
  const ids = new Set<string>();
  const occupied = new Set<string>();

  if (!Array.isArray(objects)) {
    errors.push({ code: 'objects', message: '오브젝트 목록이 필요합니다.' });
  } else {
    objects.forEach((object, index) => {
      if (!isRecord(object)) {
        errors.push({ code: 'object', message: `${index + 1}번째 오브젝트 형식이 올바르지 않습니다.` });
        return;
      }

      const id = object.id;
      const kind = object.kind;
      const position = object.position;

      if (typeof id !== 'string' || id.length === 0) {
        errors.push({ code: 'object-id', message: `${index + 1}번째 오브젝트 식별자가 올바르지 않습니다.` });
      } else if (ids.has(id)) {
        errors.push({ code: 'object-id', message: `오브젝트 식별자가 중복되었습니다: ${id}` });
      } else {
        ids.add(id);
      }

      if (!objectKinds.includes(kind as MapObjectKind)) {
        errors.push({ code: 'object-kind', message: `지원하지 않는 오브젝트입니다: ${String(kind)}` });
      } else if (kind === 'player') {
        playerCount += 1;
        if (id !== 'player') {
          errors.push({ code: 'player-id', message: '플레이어 식별자는 player여야 합니다.' });
        }
      }

      if (!isRecord(position) || !Number.isInteger(position.x) || !Number.isInteger(position.y)) {
        errors.push({ code: 'position', message: `${String(id)}의 좌표가 올바르지 않습니다.` });
        return;
      }

      const mapPosition = { x: Number(position.x), y: Number(position.y) };
      const key = `${mapPosition.x},${mapPosition.y}`;

      if (mapPosition.x < 0 || mapPosition.x >= validColumns || mapPosition.y < 0 || mapPosition.y >= validRows) {
        errors.push({ code: 'out-of-bounds', message: `${String(id)}이 맵 범위를 벗어났습니다.`, position: mapPosition });
      } else if (Array.isArray(tiles) && Array.isArray(tiles[mapPosition.y])) {
        const tile = tiles[mapPosition.y][mapPosition.x];
        if (tile === 'wall') {
          errors.push({ code: 'object-on-wall', message: `${String(id)}을 벽에 배치할 수 없습니다.`, position: mapPosition });
        } else if (tile === 'blank') {
          errors.push({ code: 'object-on-blank', message: `${String(id)}을 맵 외부 영역에 배치할 수 없습니다.`, position: mapPosition });
        }
      }

      if (occupied.has(key)) {
        errors.push({ code: 'occupied', message: '하나의 셀에 여러 오브젝트를 배치할 수 없습니다.', position: mapPosition });
      } else {
        occupied.add(key);
      }
    });
  }

  if (playerCount !== 1) {
    errors.push({ code: 'player-count', message: '플레이어는 정확히 하나여야 합니다.' });
  }

  return errors.length === 0
    ? { ok: true, map: cloneMap(value as unknown as MapDocument) }
    : { ok: false, errors };
}

export function parseMap(text: string): MapResult {
  try {
    return validateMap(JSON.parse(text));
  } catch {
    return { ok: false, errors: [{ code: 'json', message: '맵 파일의 JSON을 해석할 수 없습니다.' }] };
  }
}

export function serializeMap(map: MapDocument): string {
  return JSON.stringify(map, null, 2);
}
