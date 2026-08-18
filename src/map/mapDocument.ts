import type { ObjectKind, Position, TileKind } from '../game/domain/types';
import { fieldKinds, fieldRules, objectKinds, objectRules } from '../game/features/rules';

export const MAP_VERSION = 1 as const;

export type MapObjectKind = ObjectKind;

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
  const fieldCounts = Object.fromEntries(fieldKinds.map((kind) => [kind, 0])) as Record<TileKind, number>;

  if (!Array.isArray(tiles) || tiles.length !== validRows) {
    errors.push({ code: 'tiles', message: '필드 행 수가 맵의 행 수와 일치해야 합니다.' });
  } else {
    tiles.forEach((row, y) => {
      if (!Array.isArray(row) || row.length !== validColumns) {
        errors.push({ code: 'tiles', message: '필드 열 수가 맵의 열 수와 일치해야 합니다.', position: { x: 0, y } });
        return;
      }

      row.forEach((tile, x) => {
        if (!fieldKinds.includes(tile as TileKind)) {
          errors.push({ code: 'tile-kind', message: `지원하지 않는 필드입니다: ${String(tile)}`, position: { x, y } });
        } else {
          fieldCounts[tile as TileKind] += 1;
        }
      });
    });
  }

  for (const kind of fieldKinds) {
    const countRule = fieldRules[kind].count;
    if (countRule && !countRule.valid(fieldCounts[kind])) {
      errors.push({ code: countRule.code, message: countRule.message });
    }
  }

  const objectCounts = Object.fromEntries(objectKinds.map((kind) => [kind, 0])) as Record<ObjectKind, number>;
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

      if (!objectKinds.includes(kind as ObjectKind)) {
        errors.push({ code: 'object-kind', message: `지원하지 않는 오브젝트입니다: ${String(kind)}` });
      } else {
        const objectKind = kind as ObjectKind;
        objectCounts[objectKind] += 1;
        const fixedId = objectRules[objectKind].fixedId;
        if (fixedId && id !== fixedId.value) {
          errors.push({ code: fixedId.code, message: fixedId.message });
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
        if (fieldKinds.includes(tile as TileKind)) {
          const placementError = fieldRules[tile as TileKind].objectPlacementError;
          if (placementError) {
            errors.push({ code: placementError.code, message: placementError.message(String(id)), position: mapPosition });
          }
        }
      }

      if (occupied.has(key)) {
        errors.push({ code: 'occupied', message: '하나의 셀에 여러 오브젝트를 배치할 수 없습니다.', position: mapPosition });
      } else {
        occupied.add(key);
      }
    });
  }

  for (const kind of objectKinds) {
    const countRule = objectRules[kind].count;
    if (countRule && !countRule.valid(objectCounts[kind])) {
      errors.push({ code: countRule.code, message: countRule.message });
    }
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
