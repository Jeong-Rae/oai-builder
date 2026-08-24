import type { Direction } from "@/src/game/domain/types";

const directionsByKey: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

export function directionFromKey(key: string): Direction | undefined {
  return directionsByKey[key] ?? directionsByKey[key.toLowerCase()];
}

export function isUndoShortcut(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">,
): boolean {
  return event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey) && !event.altKey;
}
