import { parseMap } from "@/src/map/mapDocument";
import type { Position } from "@/src/game/domain/types";
import { platePressFrames } from "@/src/game/features/fields/plate/presentation";
import { playerTextureForMove } from "@/src/game/features/presentation";
import { directionFromKey, isUndoShortcut } from "@/src/game/input";
import { createGameView } from "@/src/game/scenes/game/view";
import { createGameStoreFromMap } from "@/src/game/store/gameStore";
import { stageFor, type PlaySelection } from "@/src/game/stages";

export function createGameScene(
  selection: PlaySelection,
  onComplete: () => void,
): { view: HTMLElement; dispose(): void } {
  const view = createGameView();
  const abort = new AbortController();
  let unsubscribe: (() => void) | undefined;
  let completeTimer: number | undefined;
  const timers = new Map<string, number[]>();
  const load = async () => {
    try {
      const mapUrl = stageFor(selection).mapUrl;
      if (!mapUrl) throw new Error("stage map unavailable");
      const response = await fetch(mapUrl, { signal: abort.signal });
      const source = await response.text();
      if (!response.ok) throw new Error("map fetch failed");
      const parsed = parseMap(source);
      if (!parsed.ok) throw new Error("invalid map");
      const store = createGameStoreFromMap(parsed.map);
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
      const keydown = (event: KeyboardEvent) => {
        if (store.getState().game.status === "completed") return;
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
        view.setPlayerTexture(playerTextureForMove(game, direction, decision));
      };
      window.addEventListener("keydown", keydown);
      disposeKeydown = () => window.removeEventListener("keydown", keydown);
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") view.showError(load);
    }
  };
  let disposeKeydown = () => {};
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
  void load();
  return {
    view: view.root,
    dispose: () => {
      abort.abort();
      unsubscribe?.();
      disposeKeydown();
      if (completeTimer) window.clearTimeout(completeTimer);
      timers.forEach((entries) => entries.forEach(window.clearTimeout));
    },
  };
}
function motionDuration(duration: number): number {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
}
