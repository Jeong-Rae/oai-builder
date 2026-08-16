import { describe, expect, it } from 'vitest';

import { decide, evolveAll } from '../../src/game/domain/decider';
import { createInitialState } from '../../src/game/domain/level';
import type { Normal, Position } from '../../src/game/domain/types';

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

function normal(id: string, position: Position): Normal {
  return { id, kind: 'normal', position, controls: [] };
}

function createStateWithNormals(playerPosition: Position, normals: Normal[]) {
  const state = createStateWithPlayer(playerPosition);

  return {
    ...state,
    entities: {
      ...state.entities,
      ...Object.fromEntries(normals.map((item) => [item.id, item])),
    },
  };
}

describe('방향 컨트롤', () => {
  it('게임 시작 시 일반 오브젝트 다섯 개가 서로 다른 타일에 배치된다', () => {
    const state = createInitialState({ random: () => 0 });
    const normals = Object.values(state.entities).filter((entity) => entity.kind === 'normal');
    const positions = new Set(normals.map((item) => `${item.position.x},${item.position.y}`));

    expect(normals).toHaveLength(5);
    expect(positions).toHaveLength(5);
    expect(positions.has('0,8')).toBe(false);
    expect(positions.has('8,0')).toBe(false);
  });

  it('게임 시작 시 플레이어가 네 방향 컨트롤을 모두 소유한다', () => {
    const state = createInitialState({ boxCount: 0 });

    expect(state.entities.player.controls).toEqual(['up', 'down', 'left', 'right']);
  });

  it.each([
    ['위', { x: 0, y: 7 }, 'up'],
    ['오른쪽', { x: 1, y: 8 }, 'right'],
    ['아래', { x: 1, y: 8 }, 'down'],
    ['왼쪽', { x: 0, y: 7 }, 'left'],
  ] as const)('%s 컨트롤의 소유자는 해당 방향으로 한 칸 이동한다', (_, expectedPosition, direction) => {
    const state = direction === 'down' || direction === 'left'
      ? createStateWithPlayer({ x: 1, y: 7 })
      : createInitialState({ boxCount: 0 });
    const decision = decide(state, { type: 'player/move', direction });
    const next = evolveAll(state, decision.events);

    expect(decision.rejectedBy).toBeUndefined();
    expect(next.entities.player.position).toEqual(expectedPosition);
  });

  it('소유자는 보드 밖이나 벽으로 이동할 수 없다', () => {
    const state = createInitialState({ boxCount: 0 });
    state.tiles[7][0] = 'wall';

    expect(decide(state, { type: 'player/move', direction: 'left' }).rejectedBy).toBe('out-of-bounds');
    expect(decide(state, { type: 'player/move', direction: 'up' }).rejectedBy).toBe('wall');
  });
});

describe('컨트롤 전달', () => {
  it('오브젝트와 맞닿으면 위치를 유지하고 사용한 컨트롤만 전달한다', () => {
    const state = createStateWithNormals({ x: 1, y: 1 }, [normal('normal-1', { x: 2, y: 1 })]);
    const decision = decide(state, { type: 'player/move', direction: 'right' });
    const next = evolveAll(state, decision.events);

    expect(decision.events).toEqual([
      {
        type: 'control/transferred',
        direction: 'right',
        fromEntityId: 'player',
        toEntityId: 'normal-1',
      },
    ]);
    expect(next.entities.player.position).toEqual({ x: 1, y: 1 });
    expect(next.entities['normal-1'].position).toEqual({ x: 2, y: 1 });
    expect(next.entities.player.controls).toEqual(['up', 'down', 'left']);
    expect(next.entities['normal-1'].controls).toEqual(['right']);
  });

  it('전달된 방향키는 새 소유자 오브젝트를 이동시킨다', () => {
    const state = createStateWithNormals({ x: 1, y: 1 }, [normal('normal-1', { x: 2, y: 1 })]);
    const transferred = evolveAll(state, decide(state, { type: 'player/move', direction: 'right' }).events);
    const next = evolveAll(transferred, decide(transferred, { type: 'player/move', direction: 'right' }).events);

    expect(next.entities.player.position).toEqual({ x: 1, y: 1 });
    expect(next.entities['normal-1'].position).toEqual({ x: 3, y: 1 });
  });

  it('다른 방향 컨트롤의 소유권은 유지한다', () => {
    const state = createStateWithNormals({ x: 1, y: 1 }, [normal('normal-1', { x: 2, y: 1 })]);
    const transferred = evolveAll(state, decide(state, { type: 'player/move', direction: 'right' }).events);
    const next = evolveAll(transferred, decide(transferred, { type: 'player/move', direction: 'up' }).events);

    expect(next.entities.player.position).toEqual({ x: 1, y: 0 });
    expect(next.entities['normal-1'].position).toEqual({ x: 2, y: 1 });
  });
});

describe('Goal 열림', () => {
  it('플레이어가 goal의 인접 칸에 도착하면 한 번 열린다', () => {
    const state = createStateWithPlayer({ x: 6, y: 0 });
    const firstDecision = decide(state, { type: 'player/move', direction: 'right' });
    const opened = evolveAll(state, firstDecision.events);
    const secondDecision = decide(opened, { type: 'player/move', direction: 'left' });

    expect(firstDecision.events.map((event) => event.type)).toEqual([
      'entity/moved',
      'goal/opened',
    ]);
    expect(opened.goalOpened).toBe(true);
    expect(secondDecision.events.map((event) => event.type)).toEqual(['entity/moved']);
  });
});

describe('출구 도달', () => {
  it('플레이어가 출구에 도착하면 게임 완료 이벤트가 발생한다', () => {
    const state = createStateWithPlayer({ x: 7, y: 0 });
    const decision = decide(state, { type: 'player/move', direction: 'right' });
    const next = evolveAll(state, decision.events);

    expect(decision.events.map((event) => event.type)).toEqual([
      'entity/moved',
      'game/completed',
    ]);
    expect(next.status).toBe('completed');
  });
});
