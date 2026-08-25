import type {
  Decision,
  Direction,
  Entity,
  GameEvent,
  GameState,
  ObjectKind,
  RejectionReason,
} from "@/src/game/domain/types";

export type TutorialMascotKey = "happy" | "flag" | "lens";
export type TutorialAction = "hint" | "undo" | "reset";
export type TutorialActionResult = "succeeded" | "unavailable";
export type TutorialOutcome = "moved" | "interacted" | "rejected";

export interface TutorialTextPart {
  text: string;
  emphasis?: boolean;
}

export interface TutorialCue {
  id: string;
  lines: readonly (readonly TutorialTextPart[])[];
  mascot: TutorialMascotKey;
  keyHint?: Direction;
}

export interface TutorialPathGuidance {
  afterInitialMs: number;
  mascot: TutorialMascotKey;
  until?: TutorialConditions;
}

export interface TutorialEntitySelector {
  role?: "actor" | "target" | "either";
  id?: string;
  kind?: ObjectKind;
}

export type TutorialCondition =
  | { type: "direction"; direction?: Direction }
  | { type: "outcome"; outcome: Exclude<TutorialOutcome, "rejected"> }
  | { type: "outcome"; outcome: "rejected"; reason?: RejectionReason }
  | { type: "event"; event: GameEvent["type"] }
  | { type: "wormhole" }
  | { type: "object"; entity: TutorialEntitySelector }
  | { type: "action"; action: TutorialAction; result?: TutorialActionResult };

export type TutorialConditions = readonly [TutorialCondition, ...TutorialCondition[]];

export interface TutorialRule {
  id: string;
  when: TutorialConditions;
  cue: TutorialCue;
  once?: boolean;
}

export interface TutorialDefinition {
  completion?: { when: TutorialConditions; waitForNext?: boolean };
  id: string;
  initialControls?: Readonly<Record<string, readonly Direction[]>>;
  mapUrl: string;
  initialCue: TutorialCue;
  pathGuidance?: TutorialPathGuidance;
  rules: readonly TutorialRule[];
}

export interface TutorialSignal {
  direction?: Direction;
  outcome?: TutorialOutcome;
  rejectedBy?: RejectionReason;
  events: readonly GameEvent[];
  action?: TutorialAction;
  actionResult?: TutorialActionResult;
  actorId?: string;
  targetId?: string;
  before: GameState;
  after: GameState;
}

const offsets: Record<Direction, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const pathCueLabels: Record<Direction, string> = {
  up: "W/↑",
  down: "S/↓",
  left: "A/←",
  right: "D/→",
};

export function createPathTutorialCue(
  direction: Direction,
  mascot: TutorialMascotKey,
): TutorialCue {
  return {
    id: `path-${direction}`,
    mascot,
    keyHint: direction,
    lines: [
      [{ text: pathCueLabels[direction], emphasis: true }, { text: "를 눌러서 나를 움직여줘!" }],
    ],
  };
}

function entityAt(game: GameState, x: number, y: number): Entity | undefined {
  return Object.values(game.entities).find(
    (entity) => entity.position.x === x && entity.position.y === y,
  );
}

export function createMoveTutorialSignal(
  before: GameState,
  after: GameState,
  direction: Direction,
  decision: Decision,
): TutorialSignal {
  const actor = Object.values(before.entities).find((entity) =>
    entity.controls.includes(direction),
  );
  const [offsetX, offsetY] = offsets[direction];
  const target = actor
    ? entityAt(before, actor.position.x + offsetX, actor.position.y + offsetY)
    : undefined;
  const interacted = decision.events.some(
    (event) => event.type === "control/transferred" || event.type === "controls/swapped",
  );

  return {
    direction,
    outcome: decision.rejectedBy ? "rejected" : interacted ? "interacted" : "moved",
    rejectedBy: decision.rejectedBy,
    events: decision.events,
    actorId: actor?.id,
    targetId: target?.id,
    before,
    after,
  };
}

export function createActionTutorialSignal(
  game: GameState,
  action: TutorialAction,
  result: TutorialActionResult,
  after = game,
): TutorialSignal {
  return { action, actionResult: result, events: [], before: game, after };
}

function entityMatches(signal: TutorialSignal, selector: TutorialEntitySelector): boolean {
  const ids =
    selector.role === "actor"
      ? [signal.actorId]
      : selector.role === "target"
        ? [signal.targetId]
        : [signal.actorId, signal.targetId];

  return ids.some((id) => {
    if (!id || (selector.id && selector.id !== id)) return false;
    const entity = signal.before.entities[id] ?? signal.after.entities[id];
    return Boolean(entity && (!selector.kind || entity.kind === selector.kind));
  });
}

function conditionMatches(signal: TutorialSignal, condition: TutorialCondition): boolean {
  switch (condition.type) {
    case "direction":
      return Boolean(
        signal.direction && (!condition.direction || signal.direction === condition.direction),
      );
    case "outcome":
      return (
        signal.outcome === condition.outcome &&
        (condition.outcome !== "rejected" ||
          !condition.reason ||
          signal.rejectedBy === condition.reason)
      );
    case "event":
      return signal.events.some((event) => event.type === condition.event);
    case "wormhole":
      return signal.events.some((event) => event.type === "entity/moved" && event.wormhole);
    case "object":
      return entityMatches(signal, condition.entity);
    case "action":
      return (
        signal.action === condition.action &&
        (!condition.result || signal.actionResult === condition.result)
      );
  }
}

export function matchesTutorialConditions(
  conditions: TutorialConditions,
  signal: TutorialSignal,
): boolean {
  return conditions.every((condition) => conditionMatches(signal, condition));
}

export function selectTutorialRule(
  rules: readonly TutorialRule[],
  signal: TutorialSignal,
  shownRuleIds: ReadonlySet<string>,
): TutorialRule | undefined {
  return rules.find(
    (rule) =>
      !(rule.once && shownRuleIds.has(rule.id)) && matchesTutorialConditions(rule.when, signal),
  );
}
