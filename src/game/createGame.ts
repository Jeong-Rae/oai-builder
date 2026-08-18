import Phaser from 'phaser';

import { TILE_SIZE } from './domain/level';
import { GameScene } from './scenes/GameScene';
import { gameStore, type GameStoreApi } from './store/gameStore';

export function createPhaserGame(parent: string | HTMLElement, store: GameStoreApi = gameStore): Phaser.Game {
  const game = store.getState().game;

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: game.columns * TILE_SIZE,
    height: game.rows * TILE_SIZE,
    transparent: true,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.NONE,
    },
    scene: new GameScene(store),
  });
}
