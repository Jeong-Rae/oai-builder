import type { Direction } from './domain/types';

const directionsByKey: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export function directionFromKey(key: string): Direction | undefined {
  return directionsByKey[key];
}
