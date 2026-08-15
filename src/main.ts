import Phaser from 'phaser';

import { BOARD_COLUMNS, BOARD_ROWS, TILE_SIZE } from './game/domain/level';
import { GameScene } from './game/scenes/GameScene';
import './style.css';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: BOARD_COLUMNS * TILE_SIZE,
  height: BOARD_ROWS * TILE_SIZE,
  backgroundColor: '#080e14',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
  },
  scene: GameScene,
});
