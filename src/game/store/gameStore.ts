import { createStore } from 'zustand/vanilla';

import { decide, evolveAll } from '../domain/decider';
import { createInitialState, type InitialStateOptions } from '../domain/level';
import type { Decision, GameCommand, GameState } from '../domain/types';

export interface GameStore {
  game: GameState;
  dispatch(command: GameCommand): Decision;
  reset(): void;
}

export function createGameStore(options: InitialStateOptions = {}) {
  const createGame = () => createInitialState(options);

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

export const gameStore = createGameStore();
