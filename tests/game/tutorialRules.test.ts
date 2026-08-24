import { describe, expect, it } from "vite-plus/test";

import type { Decision, Direction, Entity, GameState } from "@/src/game/domain/types";
import { firstPlayTutorials } from "@/src/game/tutorial/definitions";
import {
  createActionTutorialSignal,
  createMoveTutorialSignal,
  createPathTutorialCue,
  selectTutorialRule,
  type TutorialCue,
  type TutorialRule,
} from "@/src/game/tutorial/rules";

const cue = (id: string, mascot: TutorialCue["mascot"] = "happy"): TutorialCue => ({
  id,
  mascot,
  lines: [[{ text: id }]],
});

function game(entities: Entity[]): GameState {
  return {
    columns: 3,
    rows: 2,
    tiles: [
      ["floor", "floor", "exit"],
      ["floor", "floor", "floor"],
    ],
    wormholePairs: [],
    entities: Object.fromEntries(entities.map((entity) => [entity.id, entity])),
    playerId: "player",
    plateStates: {},
    status: "playing",
  };
}

const player: Entity = {
  id: "player",
  kind: "player",
  position: { x: 0, y: 1 },
  controls: ["up", "down", "left", "right"],
};
const normal: Entity = {
  id: "normal-1",
  kind: "normal",
  position: { x: 1, y: 1 },
  controls: [],
};

describe("튜토리얼 안내 규칙", () => {
  it("1-1부터 1-3까지 순서대로 준비한다", () => {
    expect(firstPlayTutorials.map(({ id }) => id)).toEqual([
      "tutorial-01.stage-01",
      "tutorial-01.stage-02",
      "tutorial-01.stage-03",
    ]);
  });

  it("방향에 맞는 WASD와 채워진 화살표 안내를 만든다", () => {
    expect(
      (["up", "down", "left", "right"] as const).map((direction) =>
        createPathTutorialCue(direction, "flag"),
      ),
    ).toEqual([
      expect.objectContaining({
        keyHint: "up",
        lines: [[{ text: "W▲", emphasis: true }, { text: "를 눌러서 이동할 수 있어요!" }]],
      }),
      expect.objectContaining({
        keyHint: "down",
        lines: [[{ text: "S▼", emphasis: true }, { text: "를 눌러서 이동할 수 있어요!" }]],
      }),
      expect.objectContaining({
        keyHint: "left",
        lines: [[{ text: "A◀", emphasis: true }, { text: "를 눌러서 이동할 수 있어요!" }]],
      }),
      expect.objectContaining({
        keyHint: "right",
        lines: [[{ text: "D▶", emphasis: true }, { text: "를 눌러서 이동할 수 있어요!" }]],
      }),
    ]);
  });

  it("1-2에서 노말 블록에 컨트롤이 옮겨지면 왼쪽 이동을 안내한다", () => {
    const definition = firstPlayTutorials[1];
    const playerAtRight = { ...player, position: { x: 2, y: 1 } };
    const normalAtMiddle = { ...normal, position: { x: 1, y: 1 } };
    const before = game([playerAtRight, normalAtMiddle]);
    const decision: Decision = {
      events: [
        {
          type: "control/transferred",
          direction: "left",
          fromEntityId: "player",
          toEntityId: "normal-1",
        },
      ],
    };

    expect(definition.initialCue).toMatchObject({
      mascot: "lens",
      lines: [
        [{ text: "사물과 부딪혀 봐!" }],
        [{ text: "사물과 부딪히면, 부딪힌 방향의 방향키가 사물에게 옮겨갈 거야." }],
        [{ text: "이제 왼쪽으로 이동해봐!" }],
      ],
    });
    expect(
      selectTutorialRule(
        definition.rules,
        createMoveTutorialSignal(before, before, "left", decision),
        new Set(),
      )?.cue,
    ).toMatchObject({ mascot: "flag", keyHint: "left", id: "path-left" });
  });

  it("1-3에서 노말 블록이 플레이어에게 왼쪽 컨트롤을 전달하면 안내를 바꾼다", () => {
    const definition = firstPlayTutorials[2];
    const playerWithoutLeft = {
      ...player,
      controls: ["up", "down", "right"] as Direction[],
    };
    const normalWithLeft = {
      ...normal,
      id: "normal-2",
      controls: ["left"] as Direction[],
      position: { x: 1, y: 1 },
    };
    const before = game([playerWithoutLeft, normalWithLeft]);
    const decision: Decision = {
      events: [
        {
          type: "control/transferred",
          direction: "left",
          fromEntityId: "normal-2",
          toEntityId: "player",
        },
      ],
    };

    expect(definition).toMatchObject({
      initialControls: { player: ["up", "down", "right"], "normal-2": ["left"] },
      initialCue: {
        mascot: "lens",
        lines: [
          [{ text: "나는 지금 왼쪽으로 갈 수가 없어!" }],
          [{ text: "왼쪽으로 가야 하는데 지금 누가 움직일 수 있는 거지?" }],
        ],
      },
    });
    expect(
      selectTutorialRule(
        definition.rules,
        createMoveTutorialSignal(before, before, "left", decision),
        new Set(),
      )?.cue,
    ).toMatchObject({ mascot: "flag", lines: [[{ text: "이제 움직일 수 있어!" }]] });
  });

  it("방향, 상호작용 결과와 특정 대상 오브젝트를 함께 판정한다", () => {
    const before = game([player, normal]);
    const decision: Decision = {
      events: [
        {
          type: "control/transferred",
          direction: "right",
          fromEntityId: "player",
          toEntityId: "normal-1",
        },
      ],
    };
    const rule: TutorialRule = {
      id: "meet-normal-1",
      when: [
        { type: "direction", direction: "right" },
        { type: "outcome", outcome: "interacted" },
        { type: "event", event: "control/transferred" },
        { type: "object", entity: { role: "target", id: "normal-1", kind: "normal" } },
      ],
      cue: cue("met", "lens"),
    };

    expect(
      selectTutorialRule(
        [rule],
        createMoveTutorialSignal(before, before, "right", decision),
        new Set(),
      ),
    ).toBe(rule);
    expect(
      selectTutorialRule(
        [
          {
            ...rule,
            when: [{ type: "object", entity: { role: "target", id: "normal-2" } }],
          },
        ],
        createMoveTutorialSignal(before, before, "right", decision),
        new Set(),
      ),
    ).toBeUndefined();
  });

  it("거절 사유와 조작 결과를 구분한다", () => {
    const state = game([player]);
    const wallRule: TutorialRule = {
      id: "wall",
      when: [{ type: "outcome", outcome: "rejected", reason: "wall" }],
      cue: cue("blocked"),
    };
    const hintRule: TutorialRule = {
      id: "hint-unavailable",
      when: [{ type: "action", action: "hint", result: "unavailable" }],
      cue: cue("no-hint"),
    };

    expect(
      selectTutorialRule(
        [wallRule],
        createMoveTutorialSignal(state, state, "up", { events: [], rejectedBy: "wall" }),
        new Set(),
      ),
    ).toBe(wallRule);
    expect(
      selectTutorialRule(
        [hintRule],
        createActionTutorialSignal(state, "hint", "unavailable"),
        new Set(),
      ),
    ).toBe(hintRule);
  });

  it("먼저 선언한 규칙을 선택하고 한 번 표시한 once 규칙은 건너뛴다", () => {
    const state = game([player]);
    const first: TutorialRule = {
      id: "first",
      once: true,
      when: [{ type: "direction" }],
      cue: cue("first"),
    };
    const fallback: TutorialRule = {
      id: "fallback",
      when: [{ type: "direction" }],
      cue: cue("fallback"),
    };
    const signal = createMoveTutorialSignal(state, state, "up", {
      events: [
        {
          type: "entity/moved",
          entityId: "player",
          from: { x: 0, y: 1 },
          to: { x: 0, y: 0 },
        },
      ],
    });

    expect(selectTutorialRule([first, fallback], signal, new Set())).toBe(first);
    expect(selectTutorialRule([first, fallback], signal, new Set(["first"]))).toBe(fallback);
  });
});
