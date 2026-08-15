import { describe, expect, it } from 'vitest';

import { decide, evolve } from '../../src/game/domain/decider';
import { createInitialState } from '../../src/game/domain/level';
import type { Position } from '../../src/game/domain/types';

function createStateWithPlayer(position: Position) {
  const state = createInitialState();

  return {
    ...state,
    entities: {
      ...state.entities,
      player: {
        ...state.entities.player,
        position,
      },
    },
  };
}

describe('플레이어 이동', () => {
  it('플레이어는 위쪽의 인접한 타일로 이동한다', () => {
    const state = createInitialState();
    const decision = decide(state, { type: 'player/move', direction: 'up' });

    const next = decision.events.reduce(evolve, state);
    expect(next.entities.player.position).toEqual({ x: 0, y: 18 });
  });

  it('플레이어는 오른쪽의 인접한 타일로 이동한다', () => {
    const state = createInitialState();
    const decision = decide(state, { type: 'player/move', direction: 'right' });

    expect(decision.rejectedBy).toBeUndefined();
    expect(decision.events).toHaveLength(1);

    const next = decision.events.reduce(evolve, state);
    expect(next.entities.player.position).toEqual({ x: 1, y: 19 });
  });

  it('플레이어는 아래쪽의 인접한 타일로 이동한다', () => {
    const state = createStateWithPlayer({ x: 1, y: 18 });
    const decision = decide(state, { type: 'player/move', direction: 'down' });

    const next = decision.events.reduce(evolve, state);
    expect(next.entities.player.position).toEqual({ x: 1, y: 19 });
  });

  it('플레이어는 왼쪽의 인접한 타일로 이동한다', () => {
    const state = createStateWithPlayer({ x: 1, y: 18 });
    const decision = decide(state, { type: 'player/move', direction: 'left' });

    const next = decision.events.reduce(evolve, state);
    expect(next.entities.player.position).toEqual({ x: 0, y: 18 });
  });

  it('플레이어는 보드 밖으로 이동할 수 없다', () => {
    const state = createInitialState();
    const decision = decide(state, { type: 'player/move', direction: 'left' });

    expect(decision.events).toEqual([]);
    expect(decision.rejectedBy).toBe('out-of-bounds');
  });
});
