import { createStore } from 'zustand/vanilla';

import { decide, evolveAll } from '../domain/decider';
import { createGameStateFromMap, createInitialState, type InitialStateOptions } from '../domain/level';
import type { Decision, GameCommand, GameState } from '../domain/types';
import type { MapDocument } from '../../map/mapDocument';

export interface GameStore {
  game: GameState;
  dispatch(command: GameCommand): Decision;
  reset(): void;
}

function createStoreFrom(createGame: () => GameState) {
  return createStore<GameStore>()((set, get) => ({
    game: createGame(),

    dispatch(command) {
      const game = get().game;
      const decision = decide(game, command);

      if (decision.events.length > 0) {
        set({ game: evolveAll(game, decision.events) });
      }

      return decision;
    },

    reset() {
      set({ game: createGame() });
    },
  }));
}

export function createGameStore(options: InitialStateOptions = {}) {
  return createStoreFrom(() => createInitialState(options));
}

export function createGameStoreFromMap(map: MapDocument) {
  return createStoreFrom(() => createGameStateFromMap(map));
}

export type GameStoreApi = ReturnType<typeof createGameStore>;

export const gameStore = createGameStore();
