import { describe, expect, it } from 'vitest';

import { createGameStore } from '../../src/game/store/gameStore';

describe('게임 저장소', () => {
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
  });
});
