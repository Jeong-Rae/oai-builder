import type { GameState, Position, TileKind } from "@/src/game/domain/types";
import type { FieldPresentation } from "@/src/game/features/presentationTypes";
import { isGateOpen } from "@/src/game/features/fields/gate/rules";

export function gateVisualFor(game: GameState | undefined) {
  return game && isGateOpen(game) ? ("gateSafe" as const) : ("gateWarn" as const);
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
    gateWarn: {
      label: "게이트·위험",
      url: new URL("@/assets/gate/gate.razer.state-warn.webp", import.meta.url).href,
      group: "field",
    },
    gateSafe: {
      label: "게이트·안전",
      url: new URL("@/assets/gate/gate.razer.state-safe.webp", import.meta.url).href,
      group: "field",
    },
  },
  toolAsset: "gateWarn",
  gameTextures: ["gateWarn", "gateSafe"],
  editorAsset: (game) => gateVisualFor(game),
  gameTexture: () => "floor",
} satisfies FieldPresentation;
