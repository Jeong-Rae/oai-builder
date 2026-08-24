import type { FieldPresentation } from "@/src/game/features/presentationTypes";

export const platePressFrames = ["platePawHigh", "platePawMid", "platePawLow"] as const;

export const platePresentation = {
  kind: "plate",
  label: "플레이트",
  assets: {
    platePawHigh: {
      label: "플레이트·높음",
      url: new URL("@/assets/plate/plate.webp", import.meta.url).href,
      group: "field",
    },
    platePawMid: {
      label: "플레이트·중간",
      url: new URL("@/assets/plate/plate.webp", import.meta.url).href,
      group: "field",
    },
    platePawLow: {
      label: "플레이트·눌림",
      url: new URL("@/assets/plate/plate.webp", import.meta.url).href,
      group: "field",
    },
  },
  toolAsset: "platePawHigh",
  gameTextures: platePressFrames,
  editorAsset: (game, positionKey) =>
    game?.plateStates[positionKey] === "active" ? "platePawLow" : "platePawHigh",
  gameTexture: () => "floor",
  overlayAsset: (game, positionKey) =>
    game?.plateStates[positionKey] === "active" ? "platePawLow" : "platePawHigh",
} satisfies FieldPresentation;
