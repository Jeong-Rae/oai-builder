import { createPathTutorialCue, type TutorialDefinition } from "@/src/game/tutorial/rules";

export const firstPlayTutorials = [
  {
    id: "tutorial-01.stage-01",
    mapUrl: new URL("@/maps/tutorial-01.stage-01.map", import.meta.url).href,
    initialCue: {
      id: "restore-constellation",
      mascot: "flag",
      lines: [[{ text: "별을 얻어 별자리를 되찾을 수 있도록 도와줘!" }]],
    },
    pathGuidance: { afterInitialMs: 2_000, mascot: "flag" },
    rules: [],
  },
  {
    completion: {
      when: [
        { type: "direction", direction: "left" },
        { type: "outcome", outcome: "moved" },
        { type: "event", event: "entity/moved" },
        {
          type: "object",
          entity: { role: "actor", id: "normal-1", kind: "normal" },
        },
      ],
    },
    id: "tutorial-01.stage-02",
    mapUrl: new URL("@/maps/tutorial-01.stage-02.map", import.meta.url).href,
    initialCue: {
      id: "meet-friend",
      mascot: "lens",
      lines: [
        [{ text: "사물과 부딪혀 봐!" }],
        [{ text: "사물과 부딪히면, 부딪힌 방향의 방향키가 사물에게 옮겨갈 거야." }],
        [{ text: "이제 왼쪽으로 이동해봐!" }],
      ],
    },
    rules: [
      {
        id: "normal-controls-transferred",
        once: true,
        when: [
          { type: "event", event: "control/transferred" },
          {
            type: "object",
            entity: { role: "target", id: "normal-1", kind: "normal" },
          },
        ],
        cue: createPathTutorialCue("left", "flag"),
      },
    ],
  },
  {
    id: "tutorial-01.stage-03",
    initialControls: {
      player: ["up", "down", "right"],
      "normal-2": ["left"],
    },
    mapUrl: new URL("@/maps/tutorial-01.stage-03.map", import.meta.url).href,
    initialCue: {
      id: "find-left-control",
      mascot: "lens",
      lines: [
        [{ text: "나는 지금 왼쪽으로 갈 수가 없어!" }],
        [{ text: "왼쪽으로 가야 하는데 지금 누가 움직일 수 있는 거지?" }],
      ],
    },
    rules: [
      {
        id: "left-control-restored",
        once: true,
        when: [
          { type: "direction", direction: "left" },
          { type: "event", event: "control/transferred" },
          { type: "object", entity: { role: "target", id: "player", kind: "player" } },
        ],
        cue: {
          id: "left-control-restored",
          mascot: "flag",
          lines: [[{ text: "이제 움직일 수 있어!" }]],
        },
      },
    ],
  },
  {
    id: "tutorial-02.stage-01",
    initialControls: { player: ["left"] },
    mapUrl: new URL("@/maps/tutorial-02.stage-01.map", import.meta.url).href,
    initialCue: {
      id: "find-wormhole",
      mascot: "lens",
      lines: [
        [{ text: "별까지 가려면 왼쪽 방향키가 필요한데…" }],
        [{ text: "여기 똑같이 생긴 포탈이 두 개가 있어!" }],
        [{ text: "한번 가까운 포탈로 이동해볼까?" }],
      ],
    },
    pathGuidance: {
      afterInitialMs: 2_000,
      mascot: "flag",
      until: [{ type: "wormhole" }],
    },
    rules: [
      {
        id: "wormhole-entered",
        once: true,
        when: [{ type: "wormhole" }],
        cue: {
          id: "wormhole-entered",
          mascot: "lens",
          lines: [
            [{ text: "똑같은 색의 포탈끼리 이어지는구나." }],
            [{ text: "포탈을 이용하면 방향키로 갈 수 없는 곳에도 갈 수 있어!" }],
            [{ text: "별까지 이동해보자!" }],
          ],
        },
      },
    ],
  },
  {
    id: "tutorial-02.stage-02",
    mapUrl: new URL("@/maps/tutorial-02.stage-02.map", import.meta.url).href,
    initialCue: {
      id: "open-gate",
      mascot: "lens",
      lines: [
        [{ text: "별까지 가야 하는데 레이저 때문에 지나갈 수가 없잖아." }],
        [{ text: "레이저를 지나가려면" }],
        [{ text: "발판 위에 사물을 올려놔야 하는데…" }],
        [{ text: "사물을 어떻게 올려둘 수 있을까?" }],
      ],
    },
    rules: [
      {
        id: "gate-opened",
        once: true,
        when: [
          { type: "event", event: "plate/activated" },
          { type: "object", entity: { role: "actor", id: "normal-1", kind: "normal" } },
        ],
        cue: {
          id: "gate-opened",
          mascot: "happy",
          lines: [
            [{ text: "와! 레이저가 초록색이 됐어!" }],
            [{ text: "이제 지나갈 수 있겠어!" }],
            [{ text: "어떤 게이트는 사물을 여러 개 올려둬야 할 수도 있으니," }],
            [{ text: "기억해두자고!" }],
          ],
        },
      },
    ],
  },
] as const satisfies readonly TutorialDefinition[];
