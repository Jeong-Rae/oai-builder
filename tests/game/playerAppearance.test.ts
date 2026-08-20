import { describe, expect, it } from "vite-plus/test";

import { createInitialState } from "../../src/game/domain/level";
import { decide } from "../../src/game/domain/decider";
import { playerTextureForMove, playerTextureKeys } from "../../src/game/features/presentation";

describe("플레이어 방향 스프라이트", () => {
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
});
