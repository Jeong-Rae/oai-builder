import type { Entity, GameEvent, GameState, Position } from "@/src/game/domain/types";
import type { FieldRule } from "@/src/game/features/ruleTypes";

export const exitRules = {
  kind: "exit",
  acceptsObject: true,
  editorPlacement: { maxCount: 1, overflow: "replace" },
  count: {
    valid: (count: number) => count === 1,
    code: "exit-count",
    message: "골은 정확히 하나여야 합니다.",
  },
} satisfies FieldRule;

export function findExit(state: GameState): Position {
  for (let y = 0; y < state.rows; y += 1) {
    const x = state.tiles[y].indexOf("exit");
    if (x >= 0) return { x, y };
  }
  return { x: 0, y: 0 };
}

export function exitEvents(state: GameState, entity: Entity, target: Position): GameEvent[] {
  if (entity.kind !== "player") return [];
  return state.tiles[target.y][target.x] === "exit" ? [{ type: "game/completed" }] : [];
}
