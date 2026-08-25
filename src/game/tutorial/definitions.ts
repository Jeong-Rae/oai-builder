import type { TutorialDefinition } from "@/src/game/tutorial/rules";

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
    rules: [
      {
        id: "goal-reached",
        once: true,
        when: [{ type: "event", event: "game/completed" }],
        cue: {
          id: "well-done",
          mascot: "happy",
          lines: [[{ text: "잘했어!" }]],
        },
      },
    ],
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
        [{ text: "사물과 부딪히면, 부딪힌 방향의 방향키가 사물에게 옮겨 가." }],
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
        cue: {
          id: "move-normal-left",
          mascot: "flag",
          keyHint: "left",
          lines: [[{ text: "A/←", emphasis: true }, { text: "를 눌러서 사물을 움직여봐!" }]],
        },
      },
      {
        id: "normal-moved-left",
        once: true,
        when: [
          { type: "direction", direction: "left" },
          { type: "outcome", outcome: "moved" },
          { type: "event", event: "entity/moved" },
          {
            type: "object",
            entity: { role: "actor", id: "normal-1", kind: "normal" },
          },
        ],
        cue: {
          id: "well-done",
          mascot: "happy",
          lines: [[{ text: "잘했어!" }]],
        },
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
          lines: [
            [{ text: "사물이 나에게 부딪히면 방향키가 돌아오네!" }],
            [{ text: "이제 움직일 수 있어!" }],
          ],
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
        [{ text: "레이저를 지나가려면 발판 위에 사물을 올려놔야 해..." }],
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
            [{ text: "어떤 레이저는 사물을 여러 개 올려둬야 하니, 기억하자!" }],
          ],
        },
      },
    ],
  },
] as const satisfies readonly TutorialDefinition[];

export function entryTutorialKey(chapterIndex: number, stageIndex: number): string {
  return `${chapterIndex}:${stageIndex}`;
}

export const entryTutorials = {
  [entryTutorialKey(1, 0)]: [
    {
      id: "tutorial-03.stage-01",
      mapUrl: new URL("@/maps/tutorial-03.stage-01.map", import.meta.url).href,
      initialCue: {
        id: "meet-anchor",
        mascot: "lens",
        keyHint: "down",
        lines: [[{ text: "어라, 저기 닻이 있네!" }], [{ text: "닻에 부딪혀볼까?" }]],
      },
      rules: [
        {
          id: "anchor-stores-control",
          once: true,
          when: [
            { type: "direction", direction: "down" },
            { type: "event", event: "control/transferred" },
            { type: "object", entity: { role: "target", id: "anchor-1", kind: "anchor" } },
          ],
          cue: {
            id: "anchor-stores-control",
            mascot: "lens",
            lines: [
              [{ text: "이런! 아래쪽 방향키가 앵커에게 갔잖아!" }],
              [{ text: "아래쪽 방향키를 눌러볼까?" }],
            ],
          },
        },
        {
          id: "anchor-fixed-rejection",
          once: true,
          when: [
            { type: "direction", direction: "down" },
            { type: "outcome", outcome: "rejected" },
          ],
          cue: {
            id: "anchor-fixed-rejection",
            mascot: "lens",
            lines: [
              [{ text: "앵커는 방향키를 가져도 움직이지 않아." }],
              [{ text: "방향키를 되찾으려면 앵커에 다시 부딪혀야 해!" }],
            ],
          },
        },
        {
          id: "anchor-returns-control",
          once: true,
          when: [
            { type: "direction", direction: "right" },
            { type: "event", event: "control/transferred" },
            { type: "object", entity: { role: "target", id: "anchor-1", kind: "anchor" } },
          ],
          cue: {
            id: "anchor-returns-control",
            mascot: "happy",
            lines: [[{ text: "와! 방향키가 돌아왔어!" }]],
          },
        },
        {
          id: "bump-anchor-again",
          once: true,
          when: [{ type: "wormhole" }],
          cue: {
            id: "bump-anchor-again",
            mascot: "flag",
            keyHint: "right",
            lines: [[{ text: "이제 앵커에 부딪혀봐!" }]],
          },
        },
        {
          id: "teleport-to-anchor",
          once: true,
          when: [{ type: "direction" }],
          cue: {
            id: "teleport-to-anchor",
            mascot: "flag",
            keyHint: "right",
            lines: [[{ text: "우선 텔레포트를 타고 앵커 옆으로 이동해보자." }]],
          },
        },
      ],
      completion: {
        when: [
          { type: "direction", direction: "right" },
          { type: "event", event: "control/transferred" },
          { type: "object", entity: { role: "target", id: "anchor-1", kind: "anchor" } },
        ],
      },
    },
    {
      id: "tutorial-03.stage-02",
      initialControls: { player: ["left", "right"], "swapper-1": ["up", "down"] },
      mapUrl: new URL("@/maps/tutorial-03.stage-02.map", import.meta.url).href,
      initialCue: {
        id: "meet-swapper",
        mascot: "lens",
        keyHint: "right",
        lines: [[{ text: "엇, 저건 스와퍼잖아?" }], [{ text: "스와퍼에 부딪혀볼까" }]],
      },
      rules: [
        {
          id: "swapper-swapped-controls",
          once: true,
          when: [
            { type: "event", event: "controls/swapped" },
            { type: "object", entity: { id: "swapper-1", kind: "swapper" } },
          ],
          cue: {
            id: "swapper-swapped-controls",
            mascot: "lens",
            keyHint: "right",
            lines: [
              [{ text: "어라? 방향키 하나가 아니라" }],
              [{ text: "가지고 있던 방향키가 전부 바뀌었네!" }],
              [{ text: "오른쪽 방향키를 눌러볼까?" }],
            ],
          },
        },
        {
          id: "swapper-moved-instead",
          once: true,
          when: [
            { type: "direction", direction: "right" },
            { type: "outcome", outcome: "moved" },
            { type: "event", event: "entity/moved" },
            { type: "object", entity: { role: "actor", id: "swapper-1", kind: "swapper" } },
          ],
          cue: {
            id: "swapper-moved-instead",
            mascot: "lens",
            lines: [
              [{ text: "이번에는 네가 아니라 스와퍼가 움직였어!" }],
              [{ text: "스와퍼가 너의 방향키를 가져갔나봐." }],
            ],
          },
        },
        {
          id: "controls-restored",
          once: true,
          when: [
            { type: "direction", direction: "left" },
            { type: "event", event: "controls/swapped" },
            { type: "object", entity: { id: "swapper-1", kind: "swapper" } },
          ],
          cue: {
            id: "controls-restored",
            mascot: "happy",
            lines: [
              [{ text: "방향키가 다시 돌아왔어!" }],
              [{ text: "스와퍼와 부딪히면" }],
              [{ text: "서로 가지고 있는 방향키가 전부 교환돼." }],
            ],
          },
        },
        {
          id: "move-swapper-back",
          once: true,
          when: [{ type: "direction" }],
          cue: {
            id: "move-swapper-back",
            mascot: "flag",
            keyHint: "left",
            lines: [[{ text: "스와퍼를 다시 고양이 쪽으로 움직여봐!" }]],
          },
        },
      ],
      completion: {
        when: [
          { type: "direction", direction: "left" },
          { type: "event", event: "controls/swapped" },
          { type: "object", entity: { id: "swapper-1", kind: "swapper" } },
        ],
      },
    },
  ] as const satisfies readonly TutorialDefinition[],
} as const;
