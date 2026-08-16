import { decide, evolveAll } from './decider';
import type { Direction, GameEvent, GameState, Position } from './types';

const directions: Direction[] = ['up', 'down', 'left', 'right'];
const offsets: Record<Direction, Position> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

export interface PathMove {
  step: number;
  entityId: string;
  from: Position;
  to: Position;
  wormhole?: Position;
}

export interface PathStep {
  direction: Direction;
  moves: PathMove[];
}

export interface PathResult {
  steps: PathStep[];
}

function stateKey(state: GameState): string {
  return JSON.stringify([
    Object.values(state.entities).sort((a, b) => a.id.localeCompare(b.id)).map((entity) => [
      entity.id, entity.position.x, entity.position.y, [...entity.controls].sort(),
    ]),
    Object.entries(state.plateStates).sort(), state.goalOpened, state.status,
  ]);
}

function movesFor(state: GameState, direction: Direction, events: GameEvent[], step: number): PathMove[] {
  return events.flatMap((event) => {
    if (event.type !== 'entity/moved') return [];
    const offset = offsets[direction];
    const entered = { x: event.from.x + offset.x, y: event.from.y + offset.y };
    const wormhole = state.tiles[entered.y]?.[entered.x] === 'wormhole'
      && (entered.x !== event.to.x || entered.y !== event.to.y) ? entered : undefined;
    return [{ step, entityId: event.entityId, from: event.from, to: event.to, wormhole }];
  });
}

/** Returns the fewest accepted direction commands that complete the game. */
export function findPath(initial: GameState): PathResult | undefined {
  const queue: Array<{ state: GameState; steps: PathStep[] }> = [{ state: initial, steps: [] }];
  const visited = new Set([stateKey(initial)]);

  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    if (current.state.status === 'completed') return { steps: current.steps };

    for (const direction of directions) {
      const decision = decide(current.state, { type: 'player/move', direction });
      if (decision.events.length === 0) continue;
      const next = evolveAll(current.state, decision.events);
      const key = stateKey(next);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({
        state: next,
        steps: [...current.steps, {
          direction,
          moves: movesFor(current.state, direction, decision.events, current.steps.length + 1),
        }],
      });
    }
  }
}
