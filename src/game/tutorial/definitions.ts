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
] as const satisfies readonly TutorialDefinition[];
