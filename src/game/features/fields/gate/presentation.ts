import type { GameState, Position, TileKind } from "@/src/game/domain/types";
import { isGateOpen } from "./rules";
import type { FieldPresentation } from "@/src/game/features/presentationTypes";

export function gateVisualFor(game: GameState | undefined) {
  return game && isGateOpen(game)
    ? { device: "gateDeviceSafe" as const, laser: undefined }
    : { device: "gateDeviceWarn" as const, laser: "gateLaserWarn" as const };
}

export type GateOrientation = "horizontal" | "vertical";

function blocksGate(tile: TileKind | undefined): boolean {
  return tile === undefined || tile === "blank" || tile === "wall";
}

export function gateOrientationFor(
  game: GameState | undefined,
  position: Position | undefined,
): GateOrientation {
  if (!game || !position) return "horizontal";

  const { x, y } = position;
  const aboveAndBelowBlocked =
    blocksGate(game.tiles[y - 1]?.[x]) && blocksGate(game.tiles[y + 1]?.[x]);
  return aboveAndBelowBlocked ? "vertical" : "horizontal";
}

export const gatePresentation = {
  kind: "gate",
  label: "게이트",
  assets: {
    gateDeviceWarn: {
      label: "게이트·경고 장치",
      url: new URL("@/assets/gate/gate.device.warn.webp", import.meta.url).href,
      group: "field",
    },
    gateLaserWarn: {
      label: "게이트·경고 레이저",
      url: new URL("@/assets/gate/gate.razer.warn.webp", import.meta.url).href,
      group: "field",
    },
    gateDeviceSafe: {
      label: "게이트·안전 장치",
      url: new URL("@/assets/gate/gate.device.safe.webp", import.meta.url).href,
      group: "field",
    },
  },
  toolAsset: "gateDeviceWarn",
  gameTextures: ["gateDeviceWarn", "gateLaserWarn", "gateDeviceSafe"],
  editorAsset: (game) => gateVisualFor(game).device,
  gameTexture: () => "floor",
} satisfies FieldPresentation;
