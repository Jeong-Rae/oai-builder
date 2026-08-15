import type {
  Decision,
  Direction,
  GameCommand,
  GameEvent,
  GameState,
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

function hasEntityAt(state: GameState, position: Position): boolean {
  return Object.values(state.entities).some(
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

export function decide(state: GameState, command: GameCommand): Decision {
  const player = getPlayer(state);
  const target = nextPosition(player.position, command.direction);

  if (!isInside(state, target)) {
    return { events: [], rejectedBy: 'out-of-bounds' };
  }

  if (hasEntityAt(state, target)) {
    return { events: [], rejectedBy: 'blocked-entity' };
  }

  return {
    events: [
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
