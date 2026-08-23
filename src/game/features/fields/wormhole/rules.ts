import type { GameState, Position, WormholePair } from "@/src/game/domain/types";
import type { FieldRule } from "@/src/game/features/ruleTypes";

export const wormholeRules = {
  kind: "wormhole",
  acceptsObject: true,
} satisfies FieldRule;

export function wormholePairAt(
  pairs: WormholePair[],
  position: Position,
): WormholePair | undefined {
  return pairs.find((pair) =>
    pair.positions.some((candidate) => candidate.x === position.x && candidate.y === position.y),
  );
}

export function wormholeDestination(state: GameState, position: Position): Position | undefined {
  return wormholePairAt(state.wormholePairs, position)?.positions.find(
    (candidate) => candidate.x !== position.x || candidate.y !== position.y,
  );
}
