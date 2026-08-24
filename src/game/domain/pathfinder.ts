import { decide, evolveAll } from "@/src/game/domain/decider";
import type { Direction, GameEvent, GameState, Position } from "@/src/game/domain/types";

const directions: Direction[] = ["up", "down", "left", "right"];

export interface PathMove {
  step: number;
  entityId: string;
  from: Position;
  to: Position;
  wormhole?: Position;
}

export interface PathStep {
  direction: Direction;
  moves: PathMove[];
}

export interface PathResult {
  steps: PathStep[];
}

export interface BalancedPathResult extends PathResult {
  cost: number;
  interactionCount: number;
  movementCount: number;
}

export type HintTarget =
  | { type: "entity"; entityId: string; position: Position }
  | { type: "field"; field: "wormhole" | "plate" | "exit"; position: Position };

function interactionTarget(
  state: GameState,
  direction: Direction,
  events: GameEvent[],
): HintTarget | undefined {
  const owner = Object.values(state.entities).find((entity) => entity.controls.includes(direction));
  if (!owner) return;

  for (const event of events) {
    if (event.type === "control/transferred") {
      const id = event.fromEntityId === owner.id ? event.toEntityId : event.fromEntityId;
      const entity = state.entities[id];
      if (entity) return { type: "entity", entityId: id, position: entity.position };
    }
    if (event.type === "controls/swapped") {
      const id = event.firstEntityId === owner.id ? event.secondEntityId : event.firstEntityId;
      const entity = state.entities[id];
      if (entity) return { type: "entity", entityId: id, position: entity.position };
    }
  }
}

function stateKey(state: GameState): string {
  return JSON.stringify([
    Object.values(state.entities)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((entity) => [
        entity.id,
        entity.position.x,
        entity.position.y,
        [...entity.controls].sort(),
      ]),
    Object.entries(state.plateStates).sort(),
    state.status,
  ]);
}

function movesFor(events: GameEvent[], step: number): PathMove[] {
  return events.flatMap((event) => {
    if (event.type !== "entity/moved") return [];
    return [
      {
        step,
        entityId: event.entityId,
        from: event.from,
        to: event.to,
        ...(event.wormhole ? { wormhole: event.wormhole } : {}),
      },
    ];
  });
}

function isObjectInteraction(events: GameEvent[]): boolean {
  return events.some(
    (event) => event.type === "control/transferred" || event.type === "controls/swapped",
  );
}

/** Returns the fewest accepted direction commands that complete the game. */
export function findPath(initial: GameState): PathResult | undefined {
  const queue: Array<{ state: GameState; steps: PathStep[] }> = [{ state: initial, steps: [] }];
  const visited = new Set([stateKey(initial)]);

  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    if (current.state.status === "completed") return { steps: current.steps };

    for (const direction of directions) {
      const decision = decide(current.state, { type: "player/move", direction });
      if (decision.events.length === 0) continue;
      const next = evolveAll(current.state, decision.events);
      const key = stateKey(next);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({
        state: next,
        steps: [
          ...current.steps,
          {
            direction,
            moves: movesFor(decision.events, current.steps.length + 1),
          },
        ],
      });
    }
  }
}

/** Returns the next object or field that matters on the shortest solution path. */
export function findNextHint(initial: GameState): HintTarget | undefined {
  const path = findPath(initial);
  if (!path) return;

  let state = initial;
  for (const { direction } of path.steps) {
    const decision = decide(state, { type: "player/move", direction });
    const move = decision.events.find((event) => event.type === "entity/moved");
    if (move?.type === "entity/moved" && move.wormhole)
      return { type: "field", field: "wormhole", position: move.wormhole };
    const plate = decision.events.find((event) => event.type === "plate/activated");
    if (plate?.type === "plate/activated")
      return { type: "field", field: "plate", position: plate.position };
    const target = interactionTarget(state, direction, decision.events);
    if (target) return target;
    if (
      decision.events.some((event) => event.type === "game/completed") &&
      move?.type === "entity/moved"
    )
      return { type: "field", field: "exit", position: move.to };
    state = evolveAll(state, decision.events);
  }
}

/**
 * Dijkstra search where ordinary moves cost 1 and object interactions cost 10.
 * An interaction is a control transfer (including anchors) or a control swap.
 */
export function findBalancedPath(initial: GameState): BalancedPathResult | undefined {
  const queue: Array<{
    state: GameState;
    steps: PathStep[];
    cost: number;
    interactionCount: number;
    movementCount: number;
  }> = [{ state: initial, steps: [], cost: 0, interactionCount: 0, movementCount: 0 }];
  const bestCost = new Map([[stateKey(initial), 0]]);

  while (queue.length > 0) {
    let lowest = 0;
    for (let index = 1; index < queue.length; index += 1) {
      if (queue[index].cost < queue[lowest].cost) lowest = index;
    }
    const current = queue.splice(lowest, 1)[0];
    if (current.cost !== bestCost.get(stateKey(current.state))) continue;
    if (current.state.status === "completed") {
      return {
        steps: current.steps,
        cost: current.cost,
        interactionCount: current.interactionCount,
        movementCount: current.movementCount,
      };
    }

    for (const direction of directions) {
      const decision = decide(current.state, { type: "player/move", direction });
      if (decision.events.length === 0) continue;
      const interaction = isObjectInteraction(decision.events);
      const next = evolveAll(current.state, decision.events);
      const key = stateKey(next);
      const cost = current.cost + (interaction ? 10 : 1);
      if (cost >= (bestCost.get(key) ?? Infinity)) continue;
      bestCost.set(key, cost);
      queue.push({
        state: next,
        steps: [
          ...current.steps,
          {
            direction,
            moves: movesFor(decision.events, current.steps.length + 1),
          },
        ],
        cost,
        interactionCount: current.interactionCount + Number(interaction),
        movementCount: current.movementCount + Number(!interaction),
      });
    }
  }
}
