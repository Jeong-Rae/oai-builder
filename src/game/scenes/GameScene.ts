import Phaser from 'phaser';

import { BOARD_COLUMNS, BOARD_ROWS, TILE_SIZE } from '../domain/level';
import { gameStore } from '../store/gameStore';

const textureUrls = {
  tile: new URL('../../../assets/tail/tile_36_36.png', import.meta.url).href,
  box: new URL('../../../assets/box/box.png', import.meta.url).href,
  player: new URL('../../../assets/playable/playable.png', import.meta.url).href,
  exit: new URL('../../../assets/gate/gate_1f.png', import.meta.url).href,
};

function toPixel(position: { x: number; y: number }) {
  return {
    x: position.x * TILE_SIZE + TILE_SIZE / 2,
    y: position.y * TILE_SIZE + TILE_SIZE / 2,
  };
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  preload(): void {
    this.load.image('tile', textureUrls.tile);
    this.load.image('box', textureUrls.box);
    this.load.image('player', textureUrls.player);
    this.load.image('exit', textureUrls.exit);
  }

  create(): void {
    for (let y = 0; y < BOARD_ROWS; y += 1) {
      for (let x = 0; x < BOARD_COLUMNS; x += 1) {
        const position = toPixel({ x, y });
        this.add.image(position.x, position.y, 'tile').setDisplaySize(TILE_SIZE, TILE_SIZE);
      }
    }

    const state = gameStore.getState().game;

    const exitPosition = toPixel({ x: BOARD_COLUMNS - 1, y: 0 });
    this.add.image(exitPosition.x, exitPosition.y, 'exit').setDisplaySize(TILE_SIZE, TILE_SIZE);

    for (const entity of Object.values(state.entities)) {
      if (entity.kind === 'box') {
        const position = toPixel(entity.position);
        this.add.image(position.x, position.y, 'box').setDisplaySize(TILE_SIZE, TILE_SIZE);
      }
    }

    const player = state.entities[state.playerId];
    const playerPosition = toPixel(player.position);
    this.add
      .image(playerPosition.x, playerPosition.y, 'player')
      .setDisplaySize(TILE_SIZE, TILE_SIZE);
  }
}
