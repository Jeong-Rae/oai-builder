import { describe, expect, it } from 'vitest';

import { decide, evolve, evolveAll } from '../../src/game/domain/decider';
import { createInitialState } from '../../src/game/domain/level';
import type { Box, Position } from '../../src/game/domain/types';

function createStateWithPlayer(position: Position) {
  const state = createInitialState({ boxCount: 0 });

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

function createStateWithBoxes(playerPosition: Position, boxes: Box[]) {
  const state = createStateWithPlayer(playerPosition);

  return {
    ...state,
    entities: {
      ...state.entities,
      ...Object.fromEntries(boxes.map((box) => [box.id, box])),
    },
  };
}

describe('플레이어 이동', () => {
  it('플레이어는 위쪽의 인접한 타일로 이동한다', () => {
    const state = createInitialState({ boxCount: 0 });
    const decision = decide(state, { type: 'player/move', direction: 'up' });

    const next = decision.events.reduce(evolve, state);
    expect(next.entities.player.position).toEqual({ x: 0, y: 8 });
  });

  it('플레이어는 오른쪽의 인접한 타일로 이동한다', () => {
    const state = createInitialState({ boxCount: 0 });
    const decision = decide(state, { type: 'player/move', direction: 'right' });

    expect(decision.rejectedBy).toBeUndefined();
    expect(decision.events).toHaveLength(1);

    const next = decision.events.reduce(evolve, state);
    expect(next.entities.player.position).toEqual({ x: 1, y: 9 });
  });

  it('플레이어는 아래쪽의 인접한 타일로 이동한다', () => {
    const state = createStateWithPlayer({ x: 1, y: 8 });
    const decision = decide(state, { type: 'player/move', direction: 'down' });

    const next = decision.events.reduce(evolve, state);
    expect(next.entities.player.position).toEqual({ x: 1, y: 9 });
  });

  it('플레이어는 왼쪽의 인접한 타일로 이동한다', () => {
    const state = createStateWithPlayer({ x: 1, y: 8 });
    const decision = decide(state, { type: 'player/move', direction: 'left' });

    const next = decision.events.reduce(evolve, state);
    expect(next.entities.player.position).toEqual({ x: 0, y: 8 });
  });

  it('플레이어는 보드 밖으로 이동할 수 없다', () => {
    const state = createInitialState({ boxCount: 0 });
    const decision = decide(state, { type: 'player/move', direction: 'left' });

    expect(decision.events).toEqual([]);
    expect(decision.rejectedBy).toBe('out-of-bounds');
  });
});

describe('상자 상호작용', () => {
  it('게임 시작 시 상자 다섯 개가 서로 다른 타일에 배치된다', () => {
    const state = createInitialState({ random: () => 0 });
    const boxes = Object.values(state.entities).filter((entity) => entity.kind === 'box');
    const positions = new Set(boxes.map((box) => `${box.position.x},${box.position.y}`));

    expect(boxes).toHaveLength(5);
    expect(positions).toHaveLength(5);
    expect(positions.has('0,9')).toBe(false);
    expect(positions.has('19,0')).toBe(false);
  });

  it('플레이어는 앞의 상자를 빈 타일로 민다', () => {
    const state = createStateWithBoxes(
      { x: 1, y: 1 },
      [{ id: 'box-1', kind: 'box', position: { x: 2, y: 1 } }],
    );

    const decision = decide(state, { type: 'player/move', direction: 'right' });
    const next = evolveAll(state, decision.events);

    expect(decision.events.map((event) => event.type)).toEqual([
      'box/pushed',
      'player/moved',
    ]);
    expect(next.entities.player.position).toEqual({ x: 2, y: 1 });
    expect(next.entities['box-1'].position).toEqual({ x: 3, y: 1 });
  });

  it('플레이어는 다른 상자로 막힌 상자를 밀 수 없다', () => {
    const state = createStateWithBoxes(
      { x: 1, y: 1 },
      [
        { id: 'box-1', kind: 'box', position: { x: 2, y: 1 } },
        { id: 'box-2', kind: 'box', position: { x: 3, y: 1 } },
      ],
    );

    const decision = decide(state, { type: 'player/move', direction: 'right' });

    expect(decision.events).toEqual([]);
    expect(decision.rejectedBy).toBe('blocked-box');
  });
});

describe('출구 도달', () => {
  it('플레이어가 출구에 도착하면 게임 완료 이벤트가 발생한다', () => {
    const state = createStateWithPlayer({ x: 18, y: 0 });
    const decision = decide(state, { type: 'player/move', direction: 'right' });
    const next = evolveAll(state, decision.events);

    expect(decision.events.map((event) => event.type)).toEqual([
      'player/moved',
      'game/completed',
    ]);
    expect(next.status).toBe('completed');
  });
});
