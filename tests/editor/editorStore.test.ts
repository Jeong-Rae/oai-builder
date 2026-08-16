import { describe, expect, it } from 'vitest';

import { createEditorStore, resizeWouldDiscard } from '../../src/editor/editorStore';
import { createGameStoreFromMap } from '../../src/game/store/gameStore';
import { createBlankMap } from '../../src/map/mapDocument';

describe('맵 에디터 저장소', () => {
  it('맵 확장 시 기존 필드를 유지하고 새 셀을 바닥으로 만든다', () => {
    const store = createEditorStore();
    store.getState().setTile({ x: 1, y: 1 }, 'plate');

    store.getState().resize(11, 10);

    expect(store.getState().draft.tiles[1][1]).toBe('plate');
    expect(store.getState().draft.tiles[9][10]).toBe('floor');
  });

  it('맵 축소 시 범위 밖 필드와 오브젝트 제거 여부를 판정한다', () => {
    const map = createBlankMap(4, 4);
    map.tiles[3][3] = 'plate';
    map.objects.push({ id: 'normal-1', kind: 'normal', position: { x: 3, y: 2 } });

    expect(resizeWouldDiscard(map, 3, 3)).toBe(true);

    const store = createEditorStore(map);
    store.getState().resize(3, 3);
    expect(store.getState().draft.objects).toEqual([]);
    expect(store.getState().draft.tiles).toHaveLength(3);
  });

  it('골과 플레이어를 새 좌표로 옮겨 하나만 유지한다', () => {
    const store = createEditorStore(createBlankMap(3, 3));
    store.getState().setTile({ x: 2, y: 0 }, 'exit');
    store.getState().setTile({ x: 1, y: 0 }, 'exit');
    store.getState().placeObject({ x: 0, y: 2 }, 'player');
    store.getState().placeObject({ x: 1, y: 2 }, 'player');

    const draft = store.getState().draft;
    expect(draft.tiles.flat().filter((tile) => tile === 'exit')).toHaveLength(1);
    expect(draft.tiles[0][1]).toBe('exit');
    expect(draft.objects.filter((object) => object.kind === 'player')).toEqual([
      { id: 'player', kind: 'player', position: { x: 1, y: 2 } },
    ]);
    expect(store.getState().errors).toEqual([]);
  });

  it('벽 배치와 지우기 규칙을 적용한다', () => {
    const store = createEditorStore(createBlankMap(2, 2));
    store.getState().placeObject({ x: 0, y: 0 }, 'normal');
    store.getState().setTile({ x: 0, y: 0 }, 'wall');
    store.getState().setTile({ x: 1, y: 0 }, 'exit');
    store.getState().erase({ x: 1, y: 0 });

    expect(store.getState().draft.objects).toEqual([]);
    expect(store.getState().draft.tiles[0]).toEqual(['wall', 'floor']);
  });

  it('맵 교체와 저장 완료 상태를 관리한다', () => {
    const store = createEditorStore();
    store.getState().setTile({ x: 0, y: 0 }, 'wall');
    expect(store.getState().dirty).toBe(true);

    const replacement = createBlankMap(2, 2);
    store.getState().replaceMap(replacement);
    expect(store.getState().dirty).toBe(false);

    store.getState().setTile({ x: 0, y: 0 }, 'plate');
    store.getState().markSaved();
    expect(store.getState().dirty).toBe(false);
  });

  it('라이브 테스트의 이동은 맵 초안을 변경하지 않는다', () => {
    const map = createBlankMap(3, 2);
    map.tiles[0][2] = 'exit';
    map.objects.push({ id: 'player', kind: 'player', position: { x: 0, y: 1 } });
    const editor = createEditorStore(map);
    const testGame = createGameStoreFromMap(editor.getState().draft);

    testGame.getState().dispatch({ type: 'player/move', direction: 'right' });

    expect(testGame.getState().game.entities.player.position).toEqual({ x: 1, y: 1 });
    expect(editor.getState().draft.objects[0].position).toEqual({ x: 0, y: 1 });
  });
});
