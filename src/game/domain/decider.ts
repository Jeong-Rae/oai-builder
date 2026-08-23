import type {
  Decision,
  Direction,
  Entity,
  GameCommand,
  GameEvent,
  GameState,
  Position,
} from '@/src/game/domain/types';
import { exitEvents } from '@/src/game/features/fields/exit/rules';
import { plateEvents } from '@/src/game/features/fields/plate/rules';
import { wormholeDestination } from '@/src/game/features/fields/wormhole/rules';
import { anchorCollisionEvents } from '@/src/game/features/objects/anchor/rules';
import { swapperCollisionEvents } from '@/src/game/features/objects/swapper/rules';
import { fieldRules, objectRules } from '@/src/game/features/rules';

const directionOffsets: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function nextPosition(position: Position, direction: Direction): Position {
  const offset = directionOffsets[direction];
  return { x: position.x + offset.x, y: position.y + offset.y };
}

function isInside(state: GameState, position: Position): boolean {
  return (
    position.x >= 0 &&
    position.x < state.columns &&
    position.y >= 0 &&
    position.y < state.rows
  );
}

function getEntityAt(state: GameState, position: Position): Entity | undefined {
  return Object.values(state.entities).find(
    (entity) => entity.position.x === position.x && entity.position.y === position.y,
  );
}

function moveEvents(
  state: GameState,
  entity: Entity,
  target: Position,
  wormhole?: Position,
): GameEvent[] {
  const events: GameEvent[] = [
    {
      type: 'entity/moved',
      entityId: entity.id,
      from: entity.position,
      to: target,
      ...(wormhole ? { wormhole } : {}),
    },
  ];

  events.push(...plateEvents(state, entity, target, objectRules[entity.kind].activatesPlate));
  events.push(...exitEvents(state, entity, target));

  return events;
}

export function decide(state: GameState, command: GameCommand): Decision {
  const owner = Object.values(state.entities).find((entity) =>
    entity.controls.includes(command.direction),
  );

  if (!owner) {
    throw new Error(`${command.direction} 컨트롤의 소유자를 찾을 수 없습니다.`);
  }

  if (!objectRules[owner.kind].movable) {
    return { events: [], rejectedBy: 'fixed' };
  }

  const target = nextPosition(owner.position, command.direction);

  if (!isInside(state, target)) {
    return { events: [], rejectedBy: 'out-of-bounds' };
  }

  const targetField = state.tiles[target.y][target.x];
  const entryRejection = fieldRules[targetField].entryRejection;
  const rejectedBy = typeof entryRejection === 'function' ? entryRejection(state) : entryRejection;
  if (rejectedBy) {
    return { events: [], rejectedBy };
  }

  const targetEntity = getEntityAt(state, target);

  if (!targetEntity) {
    if (targetField === 'wormhole') {
      const destination = wormholeDestination(state, target);
      if (!destination || getEntityAt(state, destination)) {
        return { events: [], rejectedBy: 'occupied' };
      }
      return { events: moveEvents(state, owner, destination, target) };
    }
    return { events: moveEvents(state, owner, target) };
  }

  const anchorEvents = anchorCollisionEvents(owner, targetEntity);
  if (anchorEvents) return { events: anchorEvents };

  const swapperEvents = swapperCollisionEvents(owner, targetEntity);
  if (swapperEvents) return { events: swapperEvents };

  return {
    events: [
      {
        type: 'control/transferred',
        direction: command.direction,
        fromEntityId: owner.id,
        toEntityId: targetEntity.id,
      },
    ],
  };
}

export function evolve(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'entity/moved': {
      const entity = state.entities[event.entityId];

      if (!entity) {
        throw new Error('이동할 오브젝트를 찾을 수 없습니다.');
      }

      return {
        ...state,
        entities: {
          ...state.entities,
          [event.entityId]: {
            ...entity,
            position: event.to,
          },
        },
      };
    }

    case 'control/transferred': {
      const from = state.entities[event.fromEntityId];
      const to = state.entities[event.toEntityId];

      if (!from || !to) {
        throw new Error('컨트롤을 전달할 오브젝트를 찾을 수 없습니다.');
      }

      return {
        ...state,
        entities: {
          ...state.entities,
          [event.fromEntityId]: {
            ...from,
            controls: from.controls.filter((direction) => direction !== event.direction),
          },
          [event.toEntityId]: {
            ...to,
            controls: [...to.controls, event.direction],
          },
        },
      };
    }

    case 'controls/swapped': {
      const first = state.entities[event.firstEntityId];
      const second = state.entities[event.secondEntityId];

      if (!first || !second) {
        throw new Error('컨트롤을 교환할 오브젝트를 찾을 수 없습니다.');
      }

      return {
        ...state,
        entities: {
          ...state.entities,
          [first.id]: { ...first, controls: second.controls },
          [second.id]: { ...second, controls: first.controls },
        },
      };
    }

    case 'plate/activated':
    case 'plate/deactivated':
      return {
        ...state,
        plateStates: {
          ...state.plateStates,
          [`${event.position.x},${event.position.y}`]: event.type === 'plate/activated' ? 'active' : 'inactive',
        },
      };

    case 'goal/opened':
    case 'goal/closed':
      return { ...state, goalOpened: event.type === 'goal/opened' };

    case 'game/completed':
      return { ...state, status: 'completed' };
  }
}

export function evolveAll(state: GameState, events: GameEvent[]): GameState {
  return events.reduce(evolve, state);
}
