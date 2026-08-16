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

export function isUndoShortcut(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>): boolean {
  return event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey) && !event.altKey;
}
