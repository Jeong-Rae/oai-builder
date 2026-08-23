import type { FieldPresentation } from "@/src/game/features/presentationTypes";

export const exitPresentation = {
  kind: "exit",
  label: "골",
  assets: {
    goalInactive: {
      label: "골·닫힘",
      url: new URL("@/assets/goal/goal.star.state-inactive.webp", import.meta.url).href,
      group: "goal",
    },
    goalActive: {
      label: "골·열림",
      url: new URL("@/assets/goal/goal.star.state-active.webp", import.meta.url).href,
      group: "goal",
    },
  },
  toolAsset: "goalInactive",
  gameTextures: ["goalInactive", "goalActive"],
  editorAsset: () => undefined,
  gameTexture: () => "floor",
  overlayAsset: (game) => (game?.goalOpened ? "goalActive" : "goalInactive"),
} satisfies FieldPresentation;
