import { describe, expect, it } from "vite-plus/test";

import { decide, evolveAll } from "@/src/game/domain/decider";
import { createInitialState } from "@/src/game/domain/level";
import type { Anchor, GameState, Normal, Position, Swapper } from "@/src/game/domain/types";

function createStateWithPlayer(position: Position) {
  const state = createInitialState({ boxCount: 0 });

  return {
    ...state,
    entities: {
      ...state.entities,
      player: {
        ...state.entities.player,
        position,
      },
    },
  };
}

function normal(id: string, position: Position): Normal {
  return { id, kind: "normal", position, controls: [] };
}

function anchor(id: string, position: Position, controls: Anchor["controls"] = []): Anchor {
  return { id, kind: "anchor", position, controls };
}

function swapper(id: string, position: Position, controls: Swapper["controls"] = []): Swapper {
  return { id, kind: "swapper", position, controls };
}

function createStateWithNormals(playerPosition: Position, normals: Normal[]) {
  const state = createStateWithPlayer(playerPosition);

  return {
    ...state,
    entities: {
      ...state.entities,
      ...Object.fromEntries(normals.map((item) => [item.id, item])),
    },
  };
}

describe("방향 컨트롤", () => {
  it("게임 시작 시 일반 오브젝트 다섯 개가 서로 다른 타일에 배치된다", () => {
    const state = createInitialState({ random: () => 0 });
    const normals = Object.values(state.entities).filter((entity) => entity.kind === "normal");
    const positions = new Set(normals.map((item) => `${item.position.x},${item.position.y}`));

    expect(normals).toHaveLength(5);
    expect(positions).toHaveLength(5);
    expect(positions.has("0,8")).toBe(false);
    expect(positions.has("8,0")).toBe(false);
  });

  it("게임 시작 시 플레이어가 네 방향 컨트롤을 모두 소유한다", () => {
    const state = createInitialState({ boxCount: 0 });

    expect(state.entities.player.controls).toEqual(["up", "down", "left", "right"]);
  });

  it.each([
    ["위", { x: 0, y: 7 }, "up"],
    ["오른쪽", { x: 1, y: 8 }, "right"],
    ["아래", { x: 1, y: 8 }, "down"],
    ["왼쪽", { x: 0, y: 7 }, "left"],
  ] as const)(
    "%s 컨트롤의 소유자는 해당 방향으로 한 칸 이동한다",
    (_, expectedPosition, direction) => {
      const state =
        direction === "down" || direction === "left"
          ? createStateWithPlayer({ x: 1, y: 7 })
          : createInitialState({ boxCount: 0 });
      const decision = decide(state, { type: "player/move", direction });
      const next = evolveAll(state, decision.events);

      expect(decision.rejectedBy).toBeUndefined();
      expect(next.entities.player.position).toEqual(expectedPosition);
    },
  );

  it("소유자는 보드 밖, blank 필드 또는 벽으로 이동할 수 없다", () => {
    const state = createInitialState({ boxCount: 0 });
    state.tiles[7][0] = "wall";
    state.tiles[8][1] = "blank";

    expect(decide(state, { type: "player/move", direction: "left" }).rejectedBy).toBe(
      "out-of-bounds",
    );
    expect(decide(state, { type: "player/move", direction: "right" }).rejectedBy).toBe(
      "out-of-bounds",
    );
    expect(decide(state, { type: "player/move", direction: "up" }).rejectedBy).toBe("wall");
  });
});

describe("컨트롤 전달", () => {
  it("오브젝트와 맞닿으면 위치를 유지하고 사용한 컨트롤만 전달한다", () => {
    const state = createStateWithNormals({ x: 1, y: 1 }, [normal("normal-1", { x: 2, y: 1 })]);
    const decision = decide(state, { type: "player/move", direction: "right" });
    const next = evolveAll(state, decision.events);

    expect(decision.events).toEqual([
      {
        type: "control/transferred",
        direction: "right",
        fromEntityId: "player",
        toEntityId: "normal-1",
      },
    ]);
    expect(next.entities.player.position).toEqual({ x: 1, y: 1 });
    expect(next.entities["normal-1"].position).toEqual({ x: 2, y: 1 });
    expect(next.entities.player.controls).toEqual(["up", "down", "left"]);
    expect(next.entities["normal-1"].controls).toEqual(["right"]);
  });

  it("전달된 방향키는 새 소유자 오브젝트를 이동시킨다", () => {
    const state = createStateWithNormals({ x: 1, y: 1 }, [normal("normal-1", { x: 2, y: 1 })]);
    const transferred = evolveAll(
      state,
      decide(state, { type: "player/move", direction: "right" }).events,
    );
    const next = evolveAll(
      transferred,
      decide(transferred, { type: "player/move", direction: "right" }).events,
    );

    expect(next.entities.player.position).toEqual({ x: 1, y: 1 });
    expect(next.entities["normal-1"].position).toEqual({ x: 3, y: 1 });
  });

  it("다른 방향 컨트롤의 소유권은 유지한다", () => {
    const state = createStateWithNormals({ x: 1, y: 1 }, [normal("normal-1", { x: 2, y: 1 })]);
    const transferred = evolveAll(
      state,
      decide(state, { type: "player/move", direction: "right" }).events,
    );
    const next = evolveAll(
      transferred,
      decide(transferred, { type: "player/move", direction: "up" }).events,
    );

    expect(next.entities.player.position).toEqual({ x: 1, y: 0 });
    expect(next.entities["normal-1"].position).toEqual({ x: 2, y: 1 });
  });
});

describe("플레이트", () => {
  it("일반 오브젝트가 플레이트에 진입하면 활성화한다", () => {
    const state = createInitialState({
      boxCount: 0,
      tileOverrides: [{ position: { x: 2, y: 1 }, kind: "plate" }],
    });
    const prepared: GameState = {
      ...state,
      entities: {
        ...state.entities,
        player: { ...state.entities.player, position: { x: 0, y: 1 } },
        "normal-1": normal("normal-1", { x: 1, y: 1 }),
      },
    };
    const transferred = evolveAll(
      prepared,
      decide(prepared, { type: "player/move", direction: "right" }).events,
    );
    const decision = decide(transferred, { type: "player/move", direction: "right" });
    const next = evolveAll(transferred, decision.events);

    expect(decision.events.map((event) => event.type)).toEqual(["entity/moved", "plate/activated"]);
    expect(next.entities["normal-1"].position).toEqual({ x: 2, y: 1 });
    expect(next.plateStates["2,1"]).toBe("active");
  });

  it("플레이트를 점유한 일반 오브젝트가 이탈하면 비활성화한다", () => {
    const state = createInitialState({
      boxCount: 0,
      tileOverrides: [{ position: { x: 1, y: 1 }, kind: "plate" }],
    });
    const prepared: GameState = {
      ...state,
      entities: {
        ...state.entities,
        player: {
          ...state.entities.player,
          controls: state.entities.player.controls.filter((direction) => direction !== "right"),
        },
        "normal-1": { ...normal("normal-1", { x: 1, y: 1 }), controls: ["right"] },
      },
      plateStates: { "1,1": "active" as const },
    };
    const decision = decide(prepared, { type: "player/move", direction: "right" });
    const next = evolveAll(prepared, decision.events);

    expect(decision.events.map((event) => event.type)).toEqual([
      "entity/moved",
      "plate/deactivated",
    ]);
    expect(next.plateStates["1,1"]).toBe("inactive");
  });
});

describe("웜홀", () => {
  it("웜홀에 진입하면 고정된 반대편 웜홀로 이동한다", () => {
    const state = createInitialState({
      boxCount: 0,
      tileOverrides: [
        { position: { x: 0, y: 0 }, kind: "wormhole" },
        { position: { x: 8, y: 8 }, kind: "wormhole" },
        { position: { x: 2, y: 1 }, kind: "wormhole" },
        { position: { x: 6, y: 4 }, kind: "wormhole" },
      ],
      wormholePairs: [
        {
          id: 1,
          variant: 3,
          positions: [
            { x: 0, y: 0 },
            { x: 8, y: 8 },
          ],
        },
        {
          id: 2,
          variant: 4,
          positions: [
            { x: 2, y: 1 },
            { x: 6, y: 4 },
          ],
        },
      ],
    });
    const prepared = {
      ...state,
      entities: {
        ...state.entities,
        player: { ...state.entities.player, position: { x: 1, y: 1 } },
      },
    };
    const decision = decide(prepared, { type: "player/move", direction: "right" });
    const next = evolveAll(prepared, decision.events);

    expect(decision.events[0]).toEqual({
      type: "entity/moved",
      entityId: "player",
      from: { x: 1, y: 1 },
      to: { x: 6, y: 4 },
      wormhole: { x: 2, y: 1 },
    });
    expect(next.entities.player.position).toEqual({ x: 6, y: 4 });
  });

  it("반대편 웜홀을 다른 오브젝트가 점유하면 진입을 거절한다", () => {
    const state = createStateWithNormals({ x: 1, y: 1 }, [normal("normal-1", { x: 6, y: 4 })]);
    state.tiles[1][2] = "wormhole";
    state.tiles[4][6] = "wormhole";
    state.wormholePairs = [
      {
        id: 1,
        variant: 2,
        positions: [
          { x: 2, y: 1 },
          { x: 6, y: 4 },
        ],
      },
    ];
    const decision = decide(state, { type: "player/move", direction: "right" });

    expect(decision).toEqual({ events: [], rejectedBy: "occupied" });
  });
});

describe("게이트", () => {
  it("연결된 모든 플레이트가 활성화되어야 열린다", () => {
    const state = createInitialState({
      boxCount: 0,
      tileOverrides: [
        { position: { x: 0, y: 0 }, kind: "plate" },
        { position: { x: 1, y: 0 }, kind: "plate" },
        { position: { x: 2, y: 1 }, kind: "gate" },
      ],
    });
    const prepared: GameState = {
      ...state,
      entities: {
        ...state.entities,
        player: { ...state.entities.player, position: { x: 1, y: 1 } },
      },
    };

    expect(decide(prepared, { type: "player/move", direction: "right" }).rejectedBy).toBe("wall");

    const partlyOpened = {
      ...prepared,
      plateStates: { "0,0": "active" as const, "1,0": "inactive" as const },
    };
    expect(decide(partlyOpened, { type: "player/move", direction: "right" }).rejectedBy).toBe(
      "wall",
    );

    const opened = {
      ...prepared,
      plateStates: { "0,0": "active" as const, "1,0": "active" as const },
    };
    const next = evolveAll(
      opened,
      decide(opened, { type: "player/move", direction: "right" }).events,
    );
    expect(next.entities.player.position).toEqual({ x: 2, y: 1 });
  });

  it("플레이어가 플레이트를 점유해도 게이트를 열지 않는다", () => {
    const state = createInitialState({
      boxCount: 0,
      tileOverrides: [
        { position: { x: 1, y: 1 }, kind: "plate" },
        { position: { x: 2, y: 1 }, kind: "gate" },
      ],
    });
    const prepared: GameState = {
      ...state,
      entities: {
        ...state.entities,
        player: { ...state.entities.player, position: { x: 0, y: 1 } },
      },
    };
    const onPlate = evolveAll(
      prepared,
      decide(prepared, { type: "player/move", direction: "right" }).events,
    );

    expect(onPlate.plateStates["1,1"]).toBe("inactive");
    expect(decide(onPlate, { type: "player/move", direction: "right" }).rejectedBy).toBe("wall");
  });
});

describe("앵커", () => {
  it("비어 있는 앵커는 전달받은 컨트롤을 보유한다", () => {
    const state = createStateWithPlayer({ x: 1, y: 1 });
    const prepared: GameState = {
      ...state,
      entities: {
        ...state.entities,
        "anchor-1": anchor("anchor-1", { x: 2, y: 1 }),
      },
    };
    const next = evolveAll(
      prepared,
      decide(prepared, { type: "player/move", direction: "right" }).events,
    );

    expect(next.entities.player.controls).not.toContain("right");
    expect(next.entities["anchor-1"].controls).toEqual(["right"]);
  });

  it("컨트롤 보유 앵커에 접촉하면 앵커의 컨트롤 집합 전체를 받는다", () => {
    const state = createInitialState({ boxCount: 0 });
    const prepared: GameState = {
      ...state,
      entities: {
        ...state.entities,
        player: { ...state.entities.player, controls: ["down"] },
        "normal-1": { ...normal("normal-1", { x: 1, y: 1 }), controls: ["right"] },
        "anchor-1": anchor("anchor-1", { x: 2, y: 1 }, ["up", "left"]),
      },
    };
    const decision = decide(prepared, { type: "player/move", direction: "right" });
    const next = evolveAll(prepared, decision.events);

    expect(decision.events).toEqual([
      {
        type: "control/transferred",
        direction: "up",
        fromEntityId: "anchor-1",
        toEntityId: "normal-1",
      },
      {
        type: "control/transferred",
        direction: "left",
        fromEntityId: "anchor-1",
        toEntityId: "normal-1",
      },
    ]);
    expect(next.entities["normal-1"].position).toEqual({ x: 1, y: 1 });
    expect(next.entities["normal-1"].controls).toEqual(["right", "up", "left"]);
    expect(next.entities["anchor-1"].controls).toEqual([]);
  });

  it("앵커가 보유한 컨트롤을 입력해도 앵커는 이동하지 않는다", () => {
    const state = createInitialState({ boxCount: 0 });
    const prepared: GameState = {
      ...state,
      entities: {
        ...state.entities,
        player: { ...state.entities.player, controls: ["up", "down", "left"] },
        "anchor-1": anchor("anchor-1", { x: 2, y: 1 }, ["right"]),
      },
    };

    expect(decide(prepared, { type: "player/move", direction: "right" })).toEqual({
      events: [],
      rejectedBy: "fixed",
    });
  });
});

describe("스와퍼", () => {
  it("소유한 컨트롤을 입력하면 해당 방향으로 한 칸 이동한다", () => {
    const state = createInitialState({ boxCount: 0 });
    const prepared: GameState = {
      ...state,
      entities: {
        ...state.entities,
        player: { ...state.entities.player, controls: ["up", "down", "left"] },
        "swapper-1": swapper("swapper-1", { x: 2, y: 1 }, ["right"]),
      },
    };
    const next = evolveAll(
      prepared,
      decide(prepared, { type: "player/move", direction: "right" }).events,
    );

    expect(next.entities["swapper-1"].position).toEqual({ x: 3, y: 1 });
  });

  it("다른 오브젝트가 스와퍼에 접촉하면 두 컨트롤 집합 전체를 교환한다", () => {
    const state = createInitialState({ boxCount: 0 });
    const prepared: GameState = {
      ...state,
      entities: {
        ...state.entities,
        player: { ...state.entities.player, controls: ["down", "left"] },
        "normal-1": { ...normal("normal-1", { x: 1, y: 1 }), controls: ["right"] },
        "swapper-1": swapper("swapper-1", { x: 2, y: 1 }, ["up"]),
      },
    };
    const decision = decide(prepared, { type: "player/move", direction: "right" });
    const next = evolveAll(prepared, decision.events);

    expect(decision.events).toEqual([
      { type: "controls/swapped", firstEntityId: "normal-1", secondEntityId: "swapper-1" },
    ]);
    expect(next.entities["normal-1"].position).toEqual({ x: 1, y: 1 });
    expect(next.entities["normal-1"].controls).toEqual(["up"]);
    expect(next.entities["swapper-1"].controls).toEqual(["right"]);
  });

  it("스와퍼가 다른 오브젝트에 접촉해도 두 컨트롤 집합 전체를 교환한다", () => {
    const state = createInitialState({ boxCount: 0 });
    const prepared: GameState = {
      ...state,
      entities: {
        ...state.entities,
        player: { ...state.entities.player, controls: ["down", "left"] },
        "normal-1": normal("normal-1", { x: 3, y: 1 }),
        "swapper-1": swapper("swapper-1", { x: 2, y: 1 }, ["right", "up"]),
      },
    };
    const next = evolveAll(
      prepared,
      decide(prepared, { type: "player/move", direction: "right" }).events,
    );

    expect(next.entities["swapper-1"].controls).toEqual([]);
    expect(next.entities["normal-1"].controls).toEqual(["right", "up"]);
  });
});

describe("Goal 열림", () => {
  it("플레이어가 goal의 대각선 칸에 도착하면 열린다", () => {
    const state = createStateWithPlayer({ x: 6, y: 1 });
    const decision = decide(state, { type: "player/move", direction: "right" });
    const opened = evolveAll(state, decision.events);

    expect(decision.events.map((event) => event.type)).toEqual(["entity/moved", "goal/opened"]);
    expect(opened.goalOpened).toBe(true);
  });

  it("플레이어가 goal의 주변 3×3 범위를 벗어나면 닫힌다", () => {
    const state = { ...createStateWithPlayer({ x: 7, y: 1 }), goalOpened: true };
    const decision = decide(state, { type: "player/move", direction: "left" });
    const closed = evolveAll(state, decision.events);

    expect(decision.events.map((event) => event.type)).toEqual(["entity/moved", "goal/closed"]);
    expect(closed.goalOpened).toBe(false);
  });
});

describe("출구 도달", () => {
  it("플레이어가 출구에 도착하면 게임 완료 이벤트가 발생한다", () => {
    const state = createStateWithPlayer({ x: 7, y: 0 });
    const decision = decide(state, { type: "player/move", direction: "right" });
    const next = evolveAll(state, decision.events);

    expect(decision.events.map((event) => event.type)).toEqual([
      "entity/moved",
      "game/completed",
      "goal/opened",
    ]);
    expect(next.status).toBe("completed");
  });
});
