import type { FieldPresentation } from "@/src/game/features/presentationTypes";
import { wormholePairAt } from "./rules";

export const wormholeAssetSlots = [
  "wormhole01",
  "wormhole02",
  "wormhole03",
  "wormhole04",
  "wormhole05",
  "wormhole06",
  "wormhole07",
  "wormhole08",
  "wormhole09",
  "wormhole10",
  "wormhole11",
  "wormhole12",
  "wormhole13",
  "wormhole14",
  "wormhole15",
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
      url: new URL("@/assets/wormhole/teleporter_01.webp", import.meta.url).href,
      group: "field",
    },
    wormhole02: {
      label: "웜홀 02",
      url: new URL("@/assets/wormhole/teleporter_02.webp", import.meta.url).href,
      group: "field",
    },
    wormhole03: {
      label: "웜홀 03",
      url: new URL("@/assets/wormhole/teleporter_03.webp", import.meta.url).href,
      group: "field",
    },
    wormhole04: {
      label: "웜홀 04",
      url: new URL("@/assets/wormhole/teleporter_04.webp", import.meta.url).href,
      group: "field",
    },
    wormhole05: {
      label: "웜홀 05",
      url: new URL("@/assets/wormhole/teleporter_05.webp", import.meta.url).href,
      group: "field",
    },
    wormhole06: {
      label: "웜홀 06",
      url: new URL("@/assets/wormhole/teleporter_06.webp", import.meta.url).href,
      group: "field",
    },
    wormhole07: {
      label: "웜홀 07",
      url: new URL("@/assets/wormhole/teleporter_07.webp", import.meta.url).href,
      group: "field",
    },
    wormhole08: {
      label: "웜홀 08",
      url: new URL("@/assets/wormhole/teleporter_08.webp", import.meta.url).href,
      group: "field",
    },
    wormhole09: {
      label: "웜홀 09",
      url: new URL("@/assets/wormhole/teleporter_09.webp", import.meta.url).href,
      group: "field",
    },
    wormhole10: {
      label: "웜홀 10",
      url: new URL("@/assets/wormhole/teleporter_10.webp", import.meta.url).href,
      group: "field",
    },
    wormhole11: {
      label: "웜홀 11",
      url: new URL("@/assets/wormhole/teleporter_11.webp", import.meta.url).href,
      group: "field",
    },
    wormhole12: {
      label: "웜홀 12",
      url: new URL("@/assets/wormhole/teleporter_12.webp", import.meta.url).href,
      group: "field",
    },
    wormhole13: {
      label: "웜홀 13",
      url: new URL("@/assets/wormhole/teleporter_13.webp", import.meta.url).href,
      group: "field",
    },
    wormhole14: {
      label: "웜홀 14",
      url: new URL("@/assets/wormhole/teleporter_14.webp", import.meta.url).href,
      group: "field",
    },
    wormhole15: {
      label: "웜홀 15",
      url: new URL("@/assets/wormhole/teleporter_15.webp", import.meta.url).href,
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
