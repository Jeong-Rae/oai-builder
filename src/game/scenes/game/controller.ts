import { parseMap } from "@/src/map/mapDocument";
import { findNextHint, findPath } from "@/src/game/domain/pathfinder";
import type { GameState, Position } from "@/src/game/domain/types";
import { platePressFrames } from "@/src/game/features/fields/plate/presentation";
import { playerTextureForMove } from "@/src/game/features/presentation";
import { directionFromKey, isUndoShortcut } from "@/src/game/input";
import {
  initialHintState,
  transitionHint,
  type HintEvent,
} from "@/src/game/scenes/game/hintMachine";
import { createGameView, type GameViewMode } from "@/src/game/scenes/game/view";
import { playSfx } from "@/src/game/sfx";
import { createGameStoreFromMap } from "@/src/game/store/gameStore";
import { stageFor, type PlaySelection } from "@/src/game/stages";
import {
  createActionTutorialSignal,
  createMoveTutorialSignal,
  createPathTutorialCue,
  selectTutorialRule,
  type TutorialAction,
  type TutorialActionResult,
  type TutorialDefinition,
  type TutorialSignal,
} from "@/src/game/tutorial/rules";

export function createGameScene(
  selection: PlaySelection,
  onComplete: () => void,
  onBack: () => void,
): GameScene {
  return createMapGameScene(stageFor(selection).mapUrl, onComplete, onBack, "stage");
}

export function createChallengeGameScene(
  mapUrl: string,
  onComplete: (durationMs: number) => void,
  onBack: () => void,
): GameScene {
  return createMapGameScene(mapUrl, onComplete, onBack, "challenge");
}

export function createTutorialGameScene(
  definition: TutorialDefinition,
  onComplete: () => void,
  onBack: () => void,
): GameScene {
  return createMapGameScene(definition.mapUrl, () => onComplete(), onBack, "tutorial", definition);
}

export interface GameScene {
  view: HTMLElement;
  ready: Promise<void>;
  activate(): void;
  dispose(): void;
}

function createMapGameScene(
  mapUrl: string | undefined,
  onComplete: (durationMs: number) => void,
  onBack: () => void,
  mode: GameViewMode,
  tutorialDefinition?: TutorialDefinition,
): GameScene {
  const timed = mode === "challenge";
  const timers = new Map<string, number[]>();
  const clearPlateTimers = () => {
    timers.forEach((entries) => entries.forEach(window.clearTimeout));
    timers.clear();
  };
  let store: ReturnType<typeof createGameStoreFromMap> | undefined;
  let motionLocked = false;
  let hintState = initialHintState;
  const shownTutorialRuleIds = new Set<string>();
  let tutorialCueId = tutorialDefinition?.initialCue.id;
  let tutorialGuidanceActive = false;
  let tutorialGuidanceTimer: number | undefined;
  const renderPathGuidance = (game: GameState) => {
    const guidance = tutorialDefinition?.pathGuidance;
    if (!guidance || game.status !== "playing") return;
    const direction = findPath(game)?.steps[0]?.direction;
    if (!direction) return;
    const cue = createPathTutorialCue(direction, guidance.mascot);
    if (tutorialCueId === cue.id) return;
    tutorialCueId = cue.id;
    view.renderTutorialCue(cue);
  };
  const sendTutorial = (signal: TutorialSignal) => {
    if (!tutorialDefinition) return;
    const rule = selectTutorialRule(tutorialDefinition.rules, signal, shownTutorialRuleIds);
    if (!rule) return;
    if (rule.once) shownTutorialRuleIds.add(rule.id);
    if (tutorialCueId === rule.cue.id) return;
    tutorialCueId = rule.cue.id;
    view.renderTutorialCue(rule.cue);
  };
  const sendTutorialAction = (
    action: TutorialAction,
    result: TutorialActionResult,
    before: GameState,
    after = before,
  ) => {
    if (tutorialDefinition) sendTutorial(createActionTutorialSignal(before, action, result, after));
  };
  const sendHint = (event: HintEvent) => {
    const next = transitionHint(hintState, event);
    if (next === hintState) return;
    hintState = next;
    view.renderHint(hintState);
  };
  const undo = () => {
    if (motionLocked || store?.getState().game.status !== "playing") return;
    const before = store.getState().game;
    if (!store.getState().undo()) {
      sendTutorialAction("undo", "unavailable", before);
      return;
    }
    clearPlateTimers();
    sendHint({ type: "hint/cleared" });
    sendTutorialAction("undo", "succeeded", before, store.getState().game);
  };
  const reset = () => {
    if (motionLocked || store?.getState().game.status !== "playing") return;
    const before = store.getState().game;
    clearPlateTimers();
    store.getState().reset();
    sendHint({ type: "hint/cleared" });
    sendTutorialAction("reset", "succeeded", before, store.getState().game);
  };
  const hint = () => {
    if (motionLocked || !store || store.getState().game.status !== "playing") return;
    const game = store.getState().game;
    const result = findNextHint(game);
    sendHint({ type: "hint/requested", result });
    sendTutorialAction("hint", result.status === "available" ? "succeeded" : "unavailable", game);
  };
  const view = createGameView(onBack, undo, reset, hint, mode);
  if (tutorialDefinition) view.renderTutorialCue(tutorialDefinition.initialCue);
  const abort = new AbortController();
  let active = false;
  let listening = false;
  let completesOnActivate = false;
  let unsubscribe: (() => void) | undefined;
  let completeTimer: number | undefined;
  let timerFrame: number | undefined;
  let startedAt: number | undefined;
  let elapsedMs = 0;
  const updateTimer = () => {
    if (startedAt === undefined) return;
    elapsedMs = performance.now() - startedAt;
    view.setElapsedMs(elapsedMs);
    timerFrame = window.requestAnimationFrame(updateTimer);
  };
  const activateTimer = () => {
    if (!timed || !active || !store || startedAt !== undefined) return;
    startedAt = performance.now();
    view.setElapsedMs(0);
    timerFrame = window.requestAnimationFrame(updateTimer);
  };
  const activateTutorialGuidance = () => {
    const guidance = tutorialDefinition?.pathGuidance;
    if (
      !guidance ||
      !active ||
      !store ||
      tutorialGuidanceActive ||
      tutorialGuidanceTimer !== undefined
    )
      return;
    tutorialGuidanceTimer = window.setTimeout(() => {
      tutorialGuidanceTimer = undefined;
      tutorialGuidanceActive = true;
      if (store) renderPathGuidance(store.getState().game);
    }, guidance.afterInitialMs);
  };
  const stopTimer = () => {
    if (!timed) return;
    if (startedAt !== undefined) elapsedMs = performance.now() - startedAt;
    if (timerFrame !== undefined) window.cancelAnimationFrame(timerFrame);
    timerFrame = undefined;
    view.setElapsedMs(elapsedMs);
  };
  const scheduleCompletion = (delay: number) => {
    stopTimer();
    completeTimer = window.setTimeout(() => onComplete(elapsedMs), delay);
  };
  const keydown = (event: KeyboardEvent) => {
    if (!store || store.getState().game.status === "completed") return;
    const undoRequested = isUndoShortcut(event);
    const direction = directionFromKey(event.key);
    if (motionLocked) {
      if (undoRequested || direction) event.preventDefault();
      return;
    }
    if (undoRequested) {
      event.preventDefault();
      undo();
      return;
    }
    if (!direction) return;
    event.preventDefault();
    const game = store.getState().game;
    const decision = store.getState().dispatch({ type: "player/move", direction });
    if (tutorialDefinition)
      sendTutorial(createMoveTutorialSignal(game, store.getState().game, direction, decision));
    sendHint({ type: "game/events", events: decision.events });
    if (decision.events.some((entry) => entry.type === "entity/moved")) playSfx("move");
    if (decision.events.some((entry) => entry.type === "game/completed")) playSfx("clear");
    view.setPlayerTexture(playerTextureForMove(game, direction, decision));
    const teleport = decision.events.find(
      (entry) => entry.type === "entity/moved" && entry.wormhole,
    );
    if (teleport?.type === "entity/moved" && teleport.wormhole) {
      motionLocked = true;
      void view.playWormhole(teleport.entityId, teleport.wormhole, teleport.to).finally(() => {
        motionLocked = false;
      });
    }
  };
  const activateInput = () => {
    if (!active || !store || listening) return;
    window.addEventListener("keydown", keydown);
    listening = true;
    activateTimer();
  };
  const activateCompletion = () => {
    if (!active || !completesOnActivate || completeTimer !== undefined) return;
    scheduleCompletion(0);
  };
  const load = async () => {
    try {
      if (!mapUrl) {
        completesOnActivate = true;
        activateCompletion();
        return;
      }
      const response = await fetch(mapUrl, { signal: abort.signal });
      const source = await response.text();
      if (!response.ok) throw new Error("map fetch failed");
      const parsed = parseMap(source);
      if (!parsed.ok) throw new Error("invalid map");
      const loadedStore = createGameStoreFromMap(parsed.map, tutorialDefinition?.initialControls);
      store = loadedStore;
      view.sync(loadedStore.getState().game);
      view.setActionAvailability(false, true);
      unsubscribe = loadedStore.subscribe((state, previous) => {
        view.sync(state.game);
        if (tutorialGuidanceActive) renderPathGuidance(state.game);
        view.setActionAvailability(
          state.game.status === "playing" && state.eventStream.length > 0,
          state.game.status === "playing",
        );
        Object.entries(state.game.plateStates).forEach(([position, value]) => {
          if (previous.game.plateStates[position] === value || value !== "active") return;
          const [x, y] = position.split(",").map(Number);
          playPlate({ x: x!, y: y! });
        });
        if (state.game.status === "completed" && previous.game.status !== "completed")
          scheduleCompletion(motionDuration(700));
      });
      activateInput();
      activateTutorialGuidance();
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") view.showError(load);
    }
  };
  const playPlate = (position: Position) => {
    const id = `${position.x},${position.y}`;
    timers.get(id)?.forEach(window.clearTimeout);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      view.setPlateFrame(position, platePressFrames[2]);
      return;
    }
    view.setPlateFrame(position, platePressFrames[0]);
    timers.set(
      id,
      platePressFrames
        .slice(1)
        .map((frame, index) =>
          window.setTimeout(() => view.setPlateFrame(position, frame), (index + 1) * 90),
        ),
    );
  };
  const ready = load();
  return {
    view: view.root,
    ready,
    activate: () => {
      active = true;
      activateInput();
      activateCompletion();
      activateTutorialGuidance();
    },
    dispose: () => {
      active = false;
      abort.abort();
      unsubscribe?.();
      if (listening) window.removeEventListener("keydown", keydown);
      listening = false;
      if (completeTimer) window.clearTimeout(completeTimer);
      if (tutorialGuidanceTimer !== undefined) window.clearTimeout(tutorialGuidanceTimer);
      if (timerFrame !== undefined) window.cancelAnimationFrame(timerFrame);
      clearPlateTimers();
      view.cancelAnimations();
    },
  };
}
function motionDuration(duration: number): number {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
}
