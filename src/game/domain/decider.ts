import type {
  Decision,
  Direction,
  Entity,
  GameCommand,
  GameEvent,
  GameState,
  Box,
  Player,
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

function getPlayer(state: GameState): Player {
  const player = state.entities[state.playerId];

  if (!player || player.kind !== 'player') {
    throw new Error('플레이어 상태를 찾을 수 없습니다.');
  }

  return player;
}

function getBox(state: GameState, boxId: string): Box {
  const box = state.entities[boxId];

  if (!box || box.kind !== 'box') {
    throw new Error('상자 상태를 찾을 수 없습니다.');
  }

  return box;
}

function playerMoveEvents(state: GameState, player: Player, target: Position): GameEvent[] {
  const events: GameEvent[] = [
    {
      type: 'player/moved',
      playerId: player.id,
      from: player.position,
      to: target,
    },
  ];

  if (state.tiles[target.y][target.x] === 'exit') {
    events.push({ type: 'game/completed' });
  }

  return events;
}

export function decide(state: GameState, command: GameCommand): Decision {
  const player = getPlayer(state);
  const target = nextPosition(player.position, command.direction);

  if (!isInside(state, target)) {
    return { events: [], rejectedBy: 'out-of-bounds' };
  }

  const targetEntity = getEntityAt(state, target);

  if (!targetEntity) {
    return { events: playerMoveEvents(state, player, target) };
  }

  const boxTarget = nextPosition(targetEntity.position, command.direction);

  if (!isInside(state, boxTarget) || getEntityAt(state, boxTarget)) {
    return { events: [], rejectedBy: 'blocked-box' };
  }

  return {
    events: [
      {
        type: 'box/pushed',
        boxId: targetEntity.id,
        from: targetEntity.position,
        to: boxTarget,
      },
      {
        type: 'player/moved',
        playerId: player.id,
        from: player.position,
        to: target,
      },
    ],
  };
}

export function evolve(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'player/moved': {
      const player = getPlayer(state);

      return {
        ...state,
        entities: {
          ...state.entities,
          [event.playerId]: {
            ...player,
            position: event.to,
          },
        },
      };
    }

    case 'box/pushed': {
      const box = getBox(state, event.boxId);

      return {
        ...state,
        entities: {
          ...state.entities,
          [event.boxId]: {
            ...box,
            position: event.to,
          },
        },
      };
    }

    case 'game/completed':
      return { ...state, status: 'completed' };
  }
}

export function evolveAll(state: GameState, events: GameEvent[]): GameState {
  return events.reduce(evolve, state);
}
