import { describe, expect, it } from 'vitest';

import { directionFromKey } from '../src/game/input';

describe('방향키 입력', () => {
  it.each([
    ['위쪽 방향키', 'ArrowUp', 'up'],
    ['아래쪽 방향키', 'ArrowDown', 'down'],
    ['왼쪽 방향키', 'ArrowLeft', 'left'],
    ['오른쪽 방향키', 'ArrowRight', 'right'],
  ])('%s는 해당 방향 이동 명령으로 해석된다', (_, key, direction) => {
    expect(directionFromKey(key)).toBe(direction);
  });

  it('방향키가 아닌 입력은 이동 명령으로 해석되지 않는다', () => {
    expect(directionFromKey('Enter')).toBeUndefined();
  });
});
