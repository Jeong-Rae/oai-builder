import { describe, expect, it } from 'vitest';

import { createInitialState } from '../../src/game/domain/level';
import { createGameStore, createGameStoreFromMap } from '../../src/game/store/gameStore';
import type { GameState } from '../../src/game/domain/types';
import { createBlankMap } from '../../src/map/mapDocument';

describe('게임 저장소', () => {
  it('맵 문서로 생성한 저장소를 같은 맵의 최초 상태로 재시작한다', () => {
    const map = createBlankMap(3, 2);
    map.tiles[0][2] = 'exit';
    map.objects.push({ id: 'player', kind: 'player', position: { x: 0, y: 1 } });
    const store = createGameStoreFromMap(map);

    store.getState().dispatch({ type: 'player/move', direction: 'right' });
    expect(store.getState().game.entities.player.position).toEqual({ x: 1, y: 1 });

    store.getState().reset();
    expect(store.getState().game.entities.player.position).toEqual({ x: 0, y: 1 });
  });

  it('이동 명령은 게임 상태를 한 번만 갱신한다', () => {
    const store = createGameStore({ boxCount: 0 });
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    const decision = store.getState().dispatch({
      type: 'player/move',
      direction: 'right',
    });

    unsubscribe();

    expect(decision.rejectedBy).toBeUndefined();
    expect(notificationCount).toBe(1);
    expect(store.getState().game.entities.player.position).toEqual({ x: 1, y: 8 });
  });

  it('거부된 이동 명령은 게임 상태를 갱신하지 않는다', () => {
    const store = createGameStore({ boxCount: 0 });
    const before = store.getState().game;
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    const decision = store.getState().dispatch({
      type: 'player/move',
      direction: 'left',
    });

    unsubscribe();

    expect(decision.rejectedBy).toBe('out-of-bounds');
    expect(notificationCount).toBe(0);
    expect(store.getState().game).toBe(before);
  });

  it('재시작하면 게임 상태가 초기 위치로 돌아간다', () => {
    const store = createGameStore({ boxCount: 0 });

    store.getState().dispatch({ type: 'player/move', direction: 'right' });
    store.getState().reset();

    expect(store.getState().game.entities.player.position).toEqual({ x: 0, y: 8 });
    expect(store.getState().game.status).toBe('playing');
    expect(store.getState().eventStream).toEqual([]);
  });

  it('되돌리기는 최근 입력의 이벤트 묶음을 제거하고 초기 상태부터 다시 적용한다', () => {
    const store = createGameStore({ boxCount: 0 });

    store.getState().dispatch({ type: 'player/move', direction: 'right' });
    store.getState().dispatch({ type: 'player/move', direction: 'up' });

    expect(store.getState().eventStream).toHaveLength(2);
    expect(store.getState().undo()).toBe(true);
    expect(store.getState().game.entities.player.position).toEqual({ x: 1, y: 8 });
    expect(store.getState().eventStream).toHaveLength(1);
  });

  it('한 입력에서 생성된 복수 이벤트는 함께 되돌린다', () => {
    const map = createBlankMap(3, 2);
    map.tiles[0][2] = 'exit';
    map.tiles[1][2] = 'plate';
    map.objects.push(
      { id: 'player', kind: 'player', position: { x: 0, y: 1 } },
      { id: 'normal-1', kind: 'normal', position: { x: 1, y: 1 } },
    );
    const store = createGameStoreFromMap(map);

    store.getState().dispatch({ type: 'player/move', direction: 'right' });
    store.getState().dispatch({ type: 'player/move', direction: 'right' });

    expect(store.getState().eventStream[1].map((event) => event.type)).toEqual(['entity/moved', 'plate/activated']);
    store.getState().undo();
    expect(store.getState().game.entities['normal-1'].position).toEqual({ x: 1, y: 1 });
    expect(store.getState().game.plateStates['2,1']).toBe('inactive');
  });

  it('되돌릴 이벤트가 없으면 상태를 변경하지 않는다', () => {
    const store = createGameStore({ boxCount: 0 });
    const before = store.getState().game;

    expect(store.getState().undo()).toBe(false);
    expect(store.getState().game).toBe(before);
  });

  it('이동과 플레이트 활성화는 한 번의 상태 갱신으로 적용한다', () => {
    const store = createGameStore({ boxCount: 0 });
    const game = createInitialState({
      boxCount: 0,
      tileOverrides: [{ position: { x: 2, y: 1 }, kind: 'plate' }],
    });
    const prepared: GameState = {
      ...game,
      entities: {
        ...game.entities,
        player: { ...game.entities.player, position: { x: 0, y: 1 } },
        'normal-1': { id: 'normal-1', kind: 'normal', position: { x: 1, y: 1 }, controls: [] },
      },
    };
    store.setState({ game: prepared });
    store.getState().dispatch({ type: 'player/move', direction: 'right' });

    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });
    const decision = store.getState().dispatch({ type: 'player/move', direction: 'right' });
    unsubscribe();

    expect(decision.events.map((event) => event.type)).toEqual(['entity/moved', 'plate/activated']);
    expect(notificationCount).toBe(1);
    expect(store.getState().game.plateStates['2,1']).toBe('active');
  });
});
