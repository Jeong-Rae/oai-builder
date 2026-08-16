import type { Decision, Direction, GameState } from './domain/types';

export const playerTextureKeys: Record<'default' | Direction, string> = {
  default: 'player-default',
  up: 'player-up',
  down: 'player-down',
  left: 'player-left',
  right: 'player-right',
};

export function playerTextureForMove(game: GameState, direction: Direction, decision: Decision): string {
  const player = game.entities[game.playerId];
  const offsets: Record<Direction, readonly [number, number]> = {
    up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
  };
  const [x, y] = offsets[direction];
  const target = game.tiles[player.position.y + y]?.[player.position.x + x];
  const playerMoved = decision.events.some((event) => event.type === 'entity/moved' && event.entityId === player.id);

  return playerMoved && target !== 'wormhole' ? playerTextureKeys[direction] : playerTextureKeys.default;
}
