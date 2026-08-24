import type { FieldPresentation } from "@/src/game/features/presentationTypes";

export const exitPresentation = {
  kind: "exit",
  label: "골",
  assets: {
    goalActive: {
      label: "골·열림",
      url: new URL("@/assets/goal/goal.star.state-active.webp", import.meta.url).href,
      group: "goal",
    },
  },
  toolAsset: "goalActive",
  gameTextures: ["goalActive"],
  editorAsset: () => undefined,
  gameTexture: () => "floor",
  overlayAsset: (game) => (game?.status === "completed" ? undefined : "goalActive"),
} satisfies FieldPresentation;
