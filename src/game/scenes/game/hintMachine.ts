import type { HintSearchResult, HintTarget } from "@/src/game/domain/pathfinder";
import type { GameEvent, Position } from "@/src/game/domain/types";

export type HintState =
  | { status: "idle" }
  | { status: "targeted"; target: HintTarget }
  | { status: "unavailable" };

export type HintEvent =
  | { type: "hint/requested"; result: HintSearchResult }
  | { type: "game/events"; events: GameEvent[] }
  | { type: "hint/cleared" };

export const initialHintState: HintState = { status: "idle" };

export function transitionHint(state: HintState, event: HintEvent): HintState {
  if (event.type === "hint/cleared") return initialHintState;
  if (event.type === "hint/requested")
    return event.result.status === "available"
      ? { status: "targeted", target: event.result.target }
      : { status: "unavailable" };
  if (state.status === "targeted" && completesHint(state.target, event.events))
    return initialHintState;
  return state;
}

function completesHint(target: HintTarget, events: GameEvent[]): boolean {
  return events.some((event) => {
    if (target.type === "entity") {
      if (event.type === "control/transferred")
        return event.fromEntityId === target.entityId || event.toEntityId === target.entityId;
      return (
        event.type === "controls/swapped" &&
        (event.firstEntityId === target.entityId || event.secondEntityId === target.entityId)
      );
    }
    if (target.field === "wormhole")
      return event.type === "entity/moved" && samePosition(event.wormhole, target.position);
    if (target.field === "plate")
      return event.type === "plate/activated" && samePosition(event.position, target.position);
    return event.type === "game/completed";
  });
}

function samePosition(first: Position | undefined, second: Position): boolean {
  return first?.x === second.x && first.y === second.y;
}
