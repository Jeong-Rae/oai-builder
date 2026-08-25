import { describe, expect, it } from "vite-plus/test";

import { decide } from "@/src/game/domain/decider";
import { createInitialState } from "@/src/game/domain/level";
import {
  playerTextureForMove,
  playerTextureFrames,
  playerTextureKeys,
  textureForEntity,
} from "@/src/game/features/presentation";

describe("플레이어 방향 스프라이트", () => {
  it("모든 플레이어 이미지를 중복 없이 미리 렌더링한다", () => {
    expect(playerTextureFrames).toEqual([
      playerTextureKeys.up,
      playerTextureKeys.down,
      playerTextureKeys.left,
      playerTextureKeys.right,
      "playerHappy",
    ]);
    expect(new Set(playerTextureFrames).size).toBe(playerTextureFrames.length);
  });

  it("기본 상태에서 아래쪽을 바라본다", () => {
    expect(playerTextureKeys.default).toBe(playerTextureKeys.down);
  });

  it("플레이어가 이동하면 입력 방향을 바라본다", () => {
    const game = createInitialState({ boxCount: 0 });
    const decision = decide(game, { type: "player/move", direction: "up" });

    expect(playerTextureForMove(game, "up", decision)).toBe(playerTextureKeys.up);
  });

  it("벽 또는 웜홀과 상호작용하면 기본 방향으로 돌아간다", () => {
    const wallGame = createInitialState({
      boxCount: 0,
      tileOverrides: [{ position: { x: 0, y: 7 }, kind: "wall" }],
    });
    const wormholeGame = createInitialState({
      boxCount: 0,
      tileOverrides: [
        { position: { x: 0, y: 7 }, kind: "wormhole" },
        { position: { x: 2, y: 2 }, kind: "wormhole" },
      ],
      wormholePairs: [
        {
          id: 1,
          variant: 1,
          positions: [
            { x: 0, y: 7 },
            { x: 2, y: 2 },
          ],
        },
      ],
    });

    expect(
      playerTextureForMove(
        wallGame,
        "up",
        decide(wallGame, { type: "player/move", direction: "up" }),
      ),
    ).toBe(playerTextureKeys.default);
    expect(
      playerTextureForMove(
        wormholeGame,
        "up",
        decide(wormholeGame, { type: "player/move", direction: "up" }),
      ),
    ).toBe(playerTextureKeys.default);
  });

  it("출구에 도착하면 별을 획득한 플레이어를 표시한다", () => {
    const game = createInitialState({ boxCount: 0 });
    const completed = { ...game, status: "completed" as const };
    const decision = {
      events: [
        {
          type: "entity/moved" as const,
          entityId: "player",
          from: { x: 0, y: 0 },
          to: { x: 1, y: 0 },
        },
        { type: "game/completed" as const },
      ],
    };

    expect(textureForEntity(completed.entities.player, completed)).toBe("playerHappy");
    expect(playerTextureForMove(game, "right", decision)).toBe("playerHappy");
  });
});
