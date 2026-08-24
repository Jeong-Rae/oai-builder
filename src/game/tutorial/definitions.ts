import type { TutorialDefinition } from "@/src/game/tutorial/rules";

export const firstPlayTutorial = {
  id: "tutorial-01",
  mapUrl: new URL("@/maps/tutorial-01.stage-01.map", import.meta.url).href,
  initialCue: {
    id: "move-to-star",
    mascot: "happy",
    lines: [
      [{ text: "별을 향해 이동해보자!" }],
      [{ text: "‘W/A/S/D’", emphasis: true }, { text: " 또는 방향키를 눌러봐!" }],
    ],
  },
  rules: [],
} as const satisfies TutorialDefinition;
