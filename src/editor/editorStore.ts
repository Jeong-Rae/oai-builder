import { createStore } from 'zustand/vanilla';

import type { Position, TileKind } from '../game/domain/types';
import {
  cloneMap,
  createBlankMap,
  validateMap,
  type MapDocument,
  type MapError,
  type MapObjectKind,
} from '../map/mapDocument';

export type EditorTool = TileKind | MapObjectKind | 'erase' | 'select';

export interface EditorState {
  draft: MapDocument;
  errors: MapError[];
  dirty: boolean;
  tool: EditorTool;
  selected?: Position;
  newMap(columns: number, rows: number): void;
  clearFields(): void;
  clearObjects(): void;
  resetMap(): void;
  resize(columns: number, rows: number): void;
  setTool(tool: EditorTool): void;
  select(position: Position): void;
  setTile(position: Position, kind: TileKind): boolean;
  placeObject(position: Position, kind: MapObjectKind): void;
  erase(position: Position): void;
  replaceMap(map: MapDocument): void;
  markSaved(): void;
}

function errorsFor(map: MapDocument): MapError[] {
  const result = validateMap(map);
  return result.ok ? [] : result.errors;
}

function changed(draft: MapDocument): Pick<EditorState, 'draft' | 'errors' | 'dirty'> {
  return { draft, errors: errorsFor(draft), dirty: true };
}

function isInside(position: Position, columns: number, rows: number): boolean {
  return position.x >= 0 && position.x < columns && position.y >= 0 && position.y < rows;
}

function nextId(map: MapDocument, kind: Exclude<MapObjectKind, 'player'>): string {
  const used = new Set(map.objects.map((object) => object.id));
  let index = 1;
  while (used.has(`${kind}-${index}`)) index += 1;
  return `${kind}-${index}`;
}

export function resizeWouldDiscard(map: MapDocument, columns: number, rows: number): boolean {
  if (columns >= map.columns && rows >= map.rows) return false;
  if (map.objects.some((object) => !isInside(object.position, columns, rows))) return true;

  for (let y = 0; y < map.rows; y += 1) {
    for (let x = 0; x < map.columns; x += 1) {
      if ((x >= columns || y >= rows) && map.tiles[y][x] !== 'floor') return true;
    }
  }

  return false;
}

export function createEditorStore(initialMap: MapDocument = createBlankMap()) {
  const initial = cloneMap(initialMap);

  return createStore<EditorState>()((set, get) => ({
    draft: initial,
    errors: errorsFor(initial),
    dirty: false,
    tool: 'floor',

    newMap(columns, rows) {
      if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(rows) || rows < 1) return;
      const draft = createBlankMap(columns, rows);
      set({ ...changed(draft), selected: undefined });
    },

    clearFields() {
      const draft = cloneMap(get().draft);
      draft.tiles = Array.from({ length: draft.rows }, () => Array<TileKind>(draft.columns).fill('floor'));
      set({ ...changed(draft), selected: undefined });
    },

    clearObjects() {
      const draft = cloneMap(get().draft);
      draft.objects = [];
      set({ ...changed(draft), selected: undefined });
    },

    resetMap() {
      const { columns, rows } = get().draft;
      set({ ...changed(createBlankMap(columns, rows)), selected: undefined });
    },

    resize(columns, rows) {
      if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(rows) || rows < 1) return;
      const current = get().draft;
      const draft = createBlankMap(columns, rows);

      for (let y = 0; y < Math.min(rows, current.rows); y += 1) {
        for (let x = 0; x < Math.min(columns, current.columns); x += 1) {
          draft.tiles[y][x] = current.tiles[y][x];
        }
      }

      draft.objects = current.objects
        .filter((object) => isInside(object.position, columns, rows))
        .map((object) => ({ ...object, position: { ...object.position } }));
      set({ ...changed(draft), selected: undefined });
    },

    setTool(tool) {
      set({ tool });
    },

    select(position) {
      set({ selected: { ...position } });
    },

    setTile(position, kind) {
      const draft = cloneMap(get().draft);
      if (!isInside(position, draft.columns, draft.rows)) return false;
      if (
        kind === 'wormhole'
        && draft.tiles[position.y][position.x] !== 'wormhole'
        && draft.tiles.flat().filter((tile) => tile === 'wormhole').length >= 2
      ) return false;
      if (
        kind === 'gate'
        && draft.tiles[position.y][position.x] !== 'gate'
        && draft.tiles.flat().includes('gate')
      ) return false;

      if (kind === 'exit') {
        draft.tiles = draft.tiles.map((row) => row.map((tile) => tile === 'exit' ? 'floor' : tile));
      }

      draft.tiles[position.y][position.x] = kind;
      if (kind === 'wall' || kind === 'blank') {
        draft.objects = draft.objects.filter((object) =>
          object.position.x !== position.x || object.position.y !== position.y,
        );
      }
      set(changed(draft));
      return true;
    },

    placeObject(position, kind) {
      const draft = cloneMap(get().draft);
      if (!isInside(position, draft.columns, draft.rows) || ['wall', 'blank'].includes(draft.tiles[position.y][position.x])) return;

      draft.objects = draft.objects.filter((object) =>
        (object.position.x !== position.x || object.position.y !== position.y)
        && (kind !== 'player' || object.kind !== 'player'),
      );
      draft.objects.push({
        id: kind === 'player' ? 'player' : nextId(draft, kind),
        kind,
        position: { ...position },
      });
      set(changed(draft));
    },

    erase(position) {
      const draft = cloneMap(get().draft);
      const objects = draft.objects.filter((object) =>
        object.position.x !== position.x || object.position.y !== position.y,
      );

      if (objects.length !== draft.objects.length) {
        draft.objects = objects;
      } else if (draft.tiles[position.y]?.[position.x] === 'exit') {
        draft.tiles[position.y][position.x] = 'floor';
      } else {
        return;
      }
      set(changed(draft));
    },

    replaceMap(map) {
      const draft = cloneMap(map);
      set({ draft, errors: errorsFor(draft), dirty: false, selected: undefined });
    },

    markSaved() {
      set({ dirty: false });
    },
  }));
}

export type EditorStoreApi = ReturnType<typeof createEditorStore>;
