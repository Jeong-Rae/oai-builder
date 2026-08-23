import type { Direction } from "@/src/game/domain/types";
import type { AssetDefinition, AssetSlot } from "../presentationTypes";

export const controlAssetSlots: Record<Direction, AssetSlot> = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
};

export const controlAssets = {
  up: {
    label: "위 방향 표시",
    url: new URL("@/assets/arrow/arrow.direction-up.webp", import.meta.url).href,
    group: "control",
  },
  down: {
    label: "아래 방향 표시",
    url: new URL("@/assets/arrow/arrow.direction-down.webp", import.meta.url).href,
    group: "control",
  },
  left: {
    label: "왼쪽 방향 표시",
    url: new URL("@/assets/arrow/arrow.direction-left.webp", import.meta.url).href,
    group: "control",
  },
  right: {
    label: "오른쪽 방향 표시",
    url: new URL("@/assets/arrow/arrow.direction-right.webp", import.meta.url).href,
    group: "control",
  },
} satisfies Partial<Record<AssetSlot, AssetDefinition>>;
