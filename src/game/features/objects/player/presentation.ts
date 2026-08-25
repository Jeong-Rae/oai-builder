import type { Decision, Direction, GameState } from "@/src/game/domain/types";
import type { AssetSlot, ObjectPresentation } from "@/src/game/features/presentationTypes";

export const playerTextureKeys: Record<"default" | Direction, AssetSlot> = {
  default: "playerDown",
  up: "playerUp",
  down: "playerDown",
  left: "playerLeft",
  right: "playerRight",
};

export const playerTextureFrames = [
  playerTextureKeys.up,
  playerTextureKeys.down,
  playerTextureKeys.left,
  playerTextureKeys.right,
  "playerHappy",
] satisfies readonly AssetSlot[];

export function playerTextureForMove(
  game: GameState,
  direction: Direction,
  decision: Decision,
): AssetSlot {
  if (decision.events.some((event) => event.type === "game/completed")) return "playerHappy";
  const player = game.entities[game.playerId];
  const offsets: Record<Direction, readonly [number, number]> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  };
  const [x, y] = offsets[direction];
  const target = game.tiles[player.position.y + y]?.[player.position.x + x];
  const playerMoved = decision.events.some(
    (event) => event.type === "entity/moved" && event.entityId === player.id,
  );
  return playerMoved && target !== "wormhole"
    ? playerTextureKeys[direction]
    : playerTextureKeys.default;
}

export const playerPresentation = {
  kind: "player",
  label: "플레이어",
  assets: {
    playerUp: {
      label: "플레이어 위 방향",
      url: new URL("@/assets/playable/player.direction-up.webp", import.meta.url).href,
      group: "object",
    },
    playerDown: {
      label: "플레이어 아래 방향",
      url: new URL("@/assets/playable/player.direction-down.webp", import.meta.url).href,
      group: "object",
    },
    playerLeft: {
      label: "플레이어 왼쪽 방향",
      url: new URL("@/assets/playable/player.direction-left.webp", import.meta.url).href,
      group: "object",
    },
    playerRight: {
      label: "플레이어 오른쪽 방향",
      url: new URL("@/assets/playable/player.direction-right.webp", import.meta.url).href,
      group: "object",
    },
    playerHappy: {
      label: "별을 획득한 플레이어",
      url: new URL("@/assets/mascot/mascot.happy.frame-01.webp", import.meta.url).href,
      group: "object",
    },
  },
  toolAsset: "playerDown",
  gameTextures: playerTextureFrames,
  editorAsset: "playerDown",
  gameTexture: (game) => (game.status === "completed" ? "playerHappy" : "playerDown"),
} satisfies ObjectPresentation;
