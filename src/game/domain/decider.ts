import type {
  Decision,
  Direction,
  Entity,
  GameCommand,
  GameEvent,
  GameState,
  Position,
} from './types';

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

function isWall(state: GameState, position: Position): boolean {
  return state.tiles[position.y][position.x] === 'wall';
}

function isBlank(state: GameState, position: Position): boolean {
  return state.tiles[position.y][position.x] === 'blank';
}

function isAdjacentToGoal(state: GameState, position: Position): boolean {
  return state.tiles.some((row, y) =>
    row.some((tile, x) => tile === 'exit' && Math.abs(position.x - x) + Math.abs(position.y - y) === 1),
  );
}

function plateEvents(state: GameState, entity: Entity, target: Position): GameEvent[] {
  if (entity.kind !== 'normal') {
    return [];
  }

  const events: GameEvent[] = [];
  const fromKey = `${entity.position.x},${entity.position.y}`;
  const targetKey = `${target.x},${target.y}`;

  if (state.tiles[entity.position.y][entity.position.x] === 'plate' && state.plateStates[fromKey] === 'active') {
    events.push({ type: 'plate/deactivated', position: entity.position });
  }

  if (state.tiles[target.y][target.x] === 'plate' && state.plateStates[targetKey] === 'inactive') {
    events.push({ type: 'plate/activated', position: target });
  }

  return events;
}

function moveEvents(state: GameState, entity: Entity, target: Position): GameEvent[] {
  const events: GameEvent[] = [
    {
      type: 'entity/moved',
      entityId: entity.id,
      from: entity.position,
      to: target,
    },
  ];

  events.push(...plateEvents(state, entity, target));

  if (entity.kind === 'player' && state.tiles[target.y][target.x] === 'exit') {
    events.push({ type: 'game/completed' });
  }

  if (entity.kind === 'player' && !state.goalOpened && isAdjacentToGoal(state, target)) {
    events.push({ type: 'goal/opened' });
  }

  return events;
}

export function decide(state: GameState, command: GameCommand): Decision {
  const owner = Object.values(state.entities).find((entity) =>
    entity.controls.includes(command.direction),
  );

  if (!owner) {
    throw new Error(`${command.direction} 컨트롤의 소유자를 찾을 수 없습니다.`);
  }

  if (owner.kind === 'handoff') {
    return { events: [], rejectedBy: 'fixed' };
  }

  const target = nextPosition(owner.position, command.direction);

  if (!isInside(state, target) || isBlank(state, target)) {
    return { events: [], rejectedBy: 'out-of-bounds' };
  }

  if (isWall(state, target)) {
    return { events: [], rejectedBy: 'wall' };
  }

  const targetEntity = getEntityAt(state, target);

  if (!targetEntity) {
    return { events: moveEvents(state, owner, target) };
  }

  if (owner.kind === 'normal' && targetEntity.kind === 'handoff' && targetEntity.controls.length > 0) {
    return {
      events: [
        ...targetEntity.controls.map((direction) => ({
          type: 'control/transferred' as const,
          direction,
          fromEntityId: targetEntity.id,
          toEntityId: owner.id,
        })),
        {
          type: 'control/transferred',
          direction: command.direction,
          fromEntityId: owner.id,
          toEntityId: targetEntity.id,
        },
      ],
    };
  }

  if (owner.kind === 'normal' && targetEntity.kind === 'swapper') {
    return {
      events: [
        ...owner.controls.map((direction) => ({
          type: 'control/transferred' as const,
          direction,
          fromEntityId: owner.id,
          toEntityId: targetEntity.id,
        })),
        ...targetEntity.controls.map((direction) => ({
          type: 'control/transferred' as const,
          direction,
          fromEntityId: targetEntity.id,
          toEntityId: owner.id,
        })),
      ],
    };
  }

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
      return { ...state, goalOpened: true };

    case 'game/completed':
      return { ...state, status: 'completed' };
  }
}

export function evolveAll(state: GameState, events: GameEvent[]): GameState {
  return events.reduce(evolve, state);
}
