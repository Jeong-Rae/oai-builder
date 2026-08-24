import { describe, expect, it } from "vite-plus/test";

import type { Decision, Entity, GameState } from "@/src/game/domain/types";
import {
  createActionTutorialSignal,
  createMoveTutorialSignal,
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
