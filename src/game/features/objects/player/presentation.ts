import type { Decision, Direction, GameState } from '../../../domain/types';
import type { AssetSlot, ObjectPresentation } from '../../presentationTypes';

export const playerTextureKeys: Record<'default' | Direction, AssetSlot> = {
  default: 'playerDefault',
  up: 'playerUp',
  down: 'playerDown',
  left: 'playerLeft',
  right: 'playerRight',
};

export function playerTextureForMove(game: GameState, direction: Direction, decision: Decision): AssetSlot {
  const player = game.entities[game.playerId];
  const offsets: Record<Direction, readonly [number, number]> = {
    up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
  };
  const [x, y] = offsets[direction];
  const target = game.tiles[player.position.y + y]?.[player.position.x + x];
  const playerMoved = decision.events.some((event) => event.type === 'entity/moved' && event.entityId === player.id);
  return playerMoved && target !== 'wormhole' ? playerTextureKeys[direction] : playerTextureKeys.default;
}

export const playerPresentation = {
  kind: 'player',
  label: '플레이어',
  assets: {
    playerDefault: { label: '플레이어·기본', url: new URL('../../../../../assets/playable/player_default.png', import.meta.url).href, group: 'object' },
    playerUp: { label: '플레이어 위 방향', url: new URL('../../../../../assets/playable/player_up.png', import.meta.url).href, group: 'object' },
    playerDown: { label: '플레이어 아래 방향', url: new URL('../../../../../assets/playable/player_down.png', import.meta.url).href, group: 'object' },
    playerLeft: { label: '플레이어 왼쪽 방향', url: new URL('../../../../../assets/playable/player_left.png', import.meta.url).href, group: 'object' },
    playerRight: { label: '플레이어 오른쪽 방향', url: new URL('../../../../../assets/playable/player_right.png', import.meta.url).href, group: 'object' },
  },
  toolAsset: 'playerDefault',
  gameTextures: Object.values(playerTextureKeys),
  editorAsset: 'playerDefault',
  gameTexture: 'playerDefault',
} satisfies ObjectPresentation;
