import { describe, expect, it } from "vite-plus/test";

import type { HintTarget } from "@/src/game/domain/pathfinder";
import {
  initialHintState,
  transitionHint,
  type HintState,
} from "@/src/game/scenes/game/hintMachine";

const target: HintTarget = {
  type: "entity",
  entityId: "normal-1",
  position: { x: 2, y: 1 },
};

describe("힌트 상태 머신", () => {
  it("탐색 결과에 따라 대상 표시와 풀이 불가 상태로 전이한다", () => {
    expect(
      transitionHint(initialHintState, {
        type: "hint/requested",
        result: { status: "available", target },
      }),
    ).toEqual({ status: "targeted", target });
    expect(
      transitionHint(initialHintState, {
        type: "hint/requested",
        result: { status: "unavailable" },
      }),
    ).toEqual({ status: "unavailable" });
  });

  it("대상과 일치하는 상호작용만 힌트를 완료한다", () => {
    const targeted: HintState = { status: "targeted", target };
    const unrelated = transitionHint(targeted, {
      type: "game/events",
      events: [
        {
          type: "control/transferred",
          direction: "right",
          fromEntityId: "player",
          toEntityId: "normal-2",
        },
      ],
    });

    expect(unrelated).toBe(targeted);
    expect(
      transitionHint(targeted, {
        type: "game/events",
        events: [
          {
            type: "control/transferred",
            direction: "right",
            fromEntityId: "player",
            toEntityId: "normal-1",
          },
        ],
      }),
    ).toBe(initialHintState);
  });

  it("초기화 이벤트는 모든 힌트 상태를 대기 상태로 되돌린다", () => {
    expect(transitionHint({ status: "targeted", target }, { type: "hint/cleared" })).toBe(
      initialHintState,
    );
    expect(transitionHint({ status: "unavailable" }, { type: "hint/cleared" })).toBe(
      initialHintState,
    );
  });
});
