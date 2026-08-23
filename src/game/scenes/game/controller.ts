import { parseMap } from "@/src/map/mapDocument";
import type { Position } from "@/src/game/domain/types";
import { platePressFrames } from "@/src/game/features/fields/plate/presentation";
import { playerTextureForMove } from "@/src/game/features/presentation";
import { directionFromKey, isUndoShortcut } from "@/src/game/input";
import { createGameView } from "@/src/game/scenes/game/view";
import { playSfx } from "@/src/game/sfx";
import { createGameStoreFromMap } from "@/src/game/store/gameStore";
import { stageFor, type PlaySelection } from "@/src/game/stages";

export function createGameScene(
  selection: PlaySelection,
  onComplete: () => void,
): { view: HTMLElement; ready: Promise<void>; activate(): void; dispose(): void } {
  const view = createGameView();
  const abort = new AbortController();
  let active = false;
  let listening = false;
  let completesOnActivate = false;
  let store: ReturnType<typeof createGameStoreFromMap> | undefined;
  let unsubscribe: (() => void) | undefined;
  let completeTimer: number | undefined;
  const timers = new Map<string, number[]>();
  const keydown = (event: KeyboardEvent) => {
    if (!store || store.getState().game.status === "completed") return;
    if (isUndoShortcut(event)) {
      event.preventDefault();
      store.getState().undo();
      return;
    }
    const direction = directionFromKey(event.key);
    if (!direction) return;
    event.preventDefault();
    const game = store.getState().game;
    const decision = store.getState().dispatch({ type: "player/move", direction });
    if (decision.events.some((entry) => entry.type === "entity/moved")) playSfx("move");
    if (decision.events.some((entry) => entry.type === "game/completed")) playSfx("clear");
    view.setPlayerTexture(playerTextureForMove(game, direction, decision));
  };
  const activateInput = () => {
    if (!active || !store || listening) return;
    window.addEventListener("keydown", keydown);
    listening = true;
  };
  const activateCompletion = () => {
    if (!active || !completesOnActivate || completeTimer !== undefined) return;
    completeTimer = window.setTimeout(onComplete, 0);
  };
  const load = async () => {
    try {
      const mapUrl = stageFor(selection).mapUrl;
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
      store = createGameStoreFromMap(parsed.map);
      view.sync(store.getState().game);
      unsubscribe = store.subscribe((state, previous) => {
        view.sync(state.game);
        Object.entries(state.game.plateStates).forEach(([position, value]) => {
          if (previous.game.plateStates[position] === value || value !== "active") return;
          const [x, y] = position.split(",").map(Number);
          playPlate({ x: x!, y: y! });
        });
        if (state.game.status === "completed" && previous.game.status !== "completed")
          completeTimer = window.setTimeout(onComplete, motionDuration(700));
      });
      activateInput();
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
    },
    dispose: () => {
      active = false;
      abort.abort();
      unsubscribe?.();
      if (listening) window.removeEventListener("keydown", keydown);
      listening = false;
      if (completeTimer) window.clearTimeout(completeTimer);
      timers.forEach((entries) => entries.forEach(window.clearTimeout));
    },
  };
}
function motionDuration(duration: number): number {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
}
