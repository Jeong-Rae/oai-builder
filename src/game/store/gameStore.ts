import { createStore } from "zustand/vanilla";

import { decide, evolveAll } from "../domain/decider";
import {
  createGameStateFromMap,
  createInitialState,
  type InitialControlsByEntity,
  type InitialStateOptions,
} from "../domain/level";
import type { Decision, GameCommand, GameEvent, GameState } from "../domain/types";
import type { MapDocument } from "@/src/map/mapDocument";

export interface GameStore {
  game: GameState;
  eventStream: GameEvent[][];
  dispatch(command: GameCommand): Decision;
  undo(): boolean;
  reset(): void;
}

function createStoreFrom(createGame: () => GameState) {
  const initialGame = createGame();

  return createStore<GameStore>()((set, get) => ({
    game: initialGame,
    eventStream: [],

    dispatch(command) {
      const game = get().game;
      const decision = decide(game, command);

      if (decision.events.length > 0) {
        set({
          game: evolveAll(game, decision.events),
          eventStream: [...get().eventStream, decision.events],
        });
      }

      return decision;
    },

    undo() {
      const eventStream = get().eventStream;
      if (eventStream.length === 0) return false;

      const nextEventStream = eventStream.slice(0, -1);
      set({
        game: nextEventStream.reduce(evolveAll, initialGame),
        eventStream: nextEventStream,
      });
      return true;
    },

    reset() {
      set({ game: initialGame, eventStream: [] });
    },
  }));
}

export function createGameStore(options: InitialStateOptions = {}) {
  return createStoreFrom(() => createInitialState(options));
}

export function createGameStoreFromMap(
  map: MapDocument,
  initialControls?: InitialControlsByEntity,
) {
  return createStoreFrom(() => createGameStateFromMap(map, initialControls));
}

export type GameStoreApi = ReturnType<typeof createGameStore>;

export const gameStore = createGameStore();
