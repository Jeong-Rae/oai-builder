import { describe, expect, it } from "vite-plus/test";

import { createGameStateFromMap } from "../../src/game/domain/level";
import { findBalancedPath, findPath } from "../../src/game/domain/pathfinder";
import type { MapDocument } from "../../src/map/mapDocument";

const map: MapDocument = {
  version: 1,
  columns: 6,
  rows: 3,
  tiles: [
    ["wall", "wall", "wormhole", "wall", "wall", "wall"],
    ["exit", "gate", "floor", "floor", "plate", "wall"],
    ["wall", "wall", "wormhole", "floor", "wall", "wall"],
  ],
  objects: [
    { id: "player", kind: "player", position: { x: 3, y: 2 } },
    { id: "normal-1", kind: "normal", position: { x: 3, y: 1 } },
  ],
};

describe("경로 찾기", () => {
  it("실제 게임 규칙으로 최소 명령 경로와 웜홀 이동을 찾는다", () => {
    const result = findPath(createGameStateFromMap(map));

    expect(result?.steps.map((step) => step.direction)).toEqual([
      "left",
      "down",
      "right",
      "right",
      "left",
      "left",
    ]);
    expect(result?.steps[0].moves[0]).toMatchObject({
      entityId: "player",
      from: { x: 3, y: 2 },
      wormhole: { x: 2, y: 2 },
      to: { x: 2, y: 0 },
    });
  });

  it("일반 이동 1, 오브젝트 상호작용 10의 비용으로 경로를 찾는다", () => {
    const result = findBalancedPath(createGameStateFromMap(map));

    expect(result).toMatchObject({ cost: 15, interactionCount: 1, movementCount: 5 });
    expect(result?.steps.map((step) => step.direction)).toEqual([
      "left",
      "down",
      "right",
      "right",
      "left",
      "left",
    ]);
  });
});
