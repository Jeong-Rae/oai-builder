import type { ObjectPresentation } from "@/src/game/features/presentationTypes";

export const normalPresentation = {
  kind: "normal",
  label: "일반",
  assets: {
    normalInactive: {
      label: "일반 오브젝트·기본",
      url: new URL("@/assets/box/box.normal.state-inactive.webp", import.meta.url).href,
      group: "object",
    },
    normalActive: {
      label: "일반 오브젝트·플레이트 활성",
      url: new URL("@/assets/box/box.normal.state-active.webp", import.meta.url).href,
      group: "object",
    },
  },
  toolAsset: "normalInactive",
  gameTextures: ["normalInactive", "normalActive"],
  editorAsset: "normalInactive",
  gameTexture: (game, entity) =>
    game.tiles[entity.position.y]?.[entity.position.x] === "plate"
      ? "normalActive"
      : "normalInactive",
} satisfies ObjectPresentation;
