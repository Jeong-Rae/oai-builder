import type { FieldPresentation } from "@/src/game/features/presentationTypes";
import { wormholePairAt } from "@/src/game/features/fields/wormhole/rules";

export const wormholeAssetSlots = [
  "wormhole01",
  "wormhole02",
  "wormhole03",
  "wormhole04",
  "wormhole05",
] as const;

export function wormholeAsset(variant: number): (typeof wormholeAssetSlots)[number] {
  return wormholeAssetSlots[variant - 1] ?? wormholeAssetSlots[0];
}

export const wormholePresentation = {
  kind: "wormhole",
  label: "웜홀",
  assets: {
    wormhole01: {
      label: "웜홀 01",
      url: new URL("@/assets/wormhole/wormhole.color-black.webp", import.meta.url).href,
      group: "field",
    },
    wormhole02: {
      label: "웜홀 02",
      url: new URL("@/assets/wormhole/wormhole.color-blue.webp", import.meta.url).href,
      group: "field",
    },
    wormhole03: {
      label: "웜홀 03",
      url: new URL("@/assets/wormhole/wormhole.color-navy.webp", import.meta.url).href,
      group: "field",
    },
    wormhole04: {
      label: "웜홀 04",
      url: new URL("@/assets/wormhole/wormhole.color-purple.webp", import.meta.url).href,
      group: "field",
    },
    wormhole05: {
      label: "웜홀 05",
      url: new URL("@/assets/wormhole/wormhole.color-white.webp", import.meta.url).href,
      group: "field",
    },
  },
  toolAsset: "wormhole01",
  gameTextures: wormholeAssetSlots,
  editorAsset: () => "wormhole01",
  gameTexture: () => "floor",
  overlayAsset: (game, positionKey) => {
    if (!game) return "wormhole01";
    const [x, y] = positionKey.split(",").map(Number);
    return wormholeAsset(wormholePairAt(game.wormholePairs, { x, y })?.variant ?? 1);
  },
  overlayFit: "height",
} satisfies FieldPresentation;
