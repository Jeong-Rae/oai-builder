import { describe, expect, it } from "vite-plus/test";

import { createGameStateFromMap } from "@/src/game/domain/level";
import { findBalancedPath, findNextHint, findPath } from "@/src/game/domain/pathfinder";
import { decide, evolveAll } from "@/src/game/domain/decider";
import type { MapDocument } from "@/src/map/mapDocument";

const map: MapDocument = {
  version: 2,
  columns: 6,
  rows: 3,
  tiles: [
    ["wall", "wall", "wormhole", "wall", "wall", "wall"],
    ["exit", "gate", "floor", "floor", "plate", "wall"],
    ["wall", "wall", "wormhole", "floor", "wall", "wall"],
  ],
  wormholePairs: [
    {
      id: 1,
      variant: 1,
      positions: [
        { x: 2, y: 0 },
        { x: 2, y: 2 },
      ],
    },
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

  it("최소 경로에서 웜홀과 다음 오브젝트를 순서대로 찾는다", () => {
    const initial = createGameStateFromMap(map);
    expect(findNextHint(initial)).toEqual({
      status: "available",
      target: { type: "field", field: "wormhole", position: { x: 2, y: 2 } },
    });

    const decision = decide(initial, { type: "player/move", direction: "left" });
    expect(findNextHint(evolveAll(initial, decision.events))).toEqual({
      status: "available",
      target: { type: "entity", entityId: "normal-1", position: { x: 3, y: 1 } },
    });
  });

  it("활성화할 플레이트와 최종 출구를 순서대로 찾는다", () => {
    let state = createGameStateFromMap(map);
    for (const direction of ["left", "down", "right"] as const) {
      const decision = decide(state, { type: "player/move", direction });
      state = evolveAll(state, decision.events);
    }
    expect(findNextHint(state)).toEqual({
      status: "available",
      target: { type: "field", field: "plate", position: { x: 4, y: 1 } },
    });

    const decision = decide(state, { type: "player/move", direction: "right" });
    state = evolveAll(state, decision.events);
    expect(findNextHint(state)).toEqual({
      status: "available",
      target: { type: "field", field: "exit", position: { x: 0, y: 1 } },
    });
  });

  it("현재 상태에서 출구에 도달할 수 없으면 풀이 불가를 반환한다", () => {
    const blocked: MapDocument = {
      version: 2,
      columns: 3,
      rows: 3,
      tiles: [
        ["exit", "wall", "wall"],
        ["wall", "floor", "wall"],
        ["wall", "wall", "wall"],
      ],
      wormholePairs: [],
      objects: [{ id: "player", kind: "player", position: { x: 1, y: 1 } }],
    };

    expect(findNextHint(createGameStateFromMap(blocked))).toEqual({ status: "unavailable" });
  });
});
