import Phaser from 'phaser';

import { BOARD_COLUMNS, BOARD_ROWS, TILE_SIZE } from '../domain/level';
import { directionFromKey } from '../input';
import { gameStore } from '../store/gameStore';
import type { Entity, GameState, Position } from '../domain/types';

const textureUrls = {
  tile: new URL('../../../assets/tail/tile.png', import.meta.url).href,
  box: new URL('../../../assets/box/box.png', import.meta.url).href,
  player: new URL('../../../assets/playable/playable.png', import.meta.url).href,
  exit1: new URL('../../../assets/gate/gate_1f.png', import.meta.url).href,
  exit2: new URL('../../../assets/gate/gate_2f.png', import.meta.url).href,
  exit3: new URL('../../../assets/gate/gate_3f.png', import.meta.url).href,
  exit4: new URL('../../../assets/gate/gate_4f.png', import.meta.url).href,
};

const exitTextureKeys = ['exit-1', 'exit-2', 'exit-3', 'exit-4'];

function toPixel(position: { x: number; y: number }) {
  return {
    x: position.x * TILE_SIZE + TILE_SIZE / 2,
    y: position.y * TILE_SIZE + TILE_SIZE / 2,
  };
}

export class GameScene extends Phaser.Scene {
  private readonly entitySprites = new Map<string, Phaser.GameObjects.Image>();
  private exitSprite?: Phaser.GameObjects.Image;
  private unsubscribe?: () => void;

  constructor() {
    super('game');
  }

  preload(): void {
    this.load.image('tile', textureUrls.tile);
    this.load.image('box', textureUrls.box);
    this.load.image('player', textureUrls.player);
    this.load.image(exitTextureKeys[0], textureUrls.exit1);
    this.load.image(exitTextureKeys[1], textureUrls.exit2);
    this.load.image(exitTextureKeys[2], textureUrls.exit3);
    this.load.image(exitTextureKeys[3], textureUrls.exit4);
  }

  create(): void {
    for (let y = 0; y < BOARD_ROWS; y += 1) {
      for (let x = 0; x < BOARD_COLUMNS; x += 1) {
        const position = toPixel({ x, y });
        this.add.image(position.x, position.y, 'tile').setDisplaySize(TILE_SIZE, TILE_SIZE);
      }
    }

    const game = gameStore.getState().game;

    const exitPosition = toPixel({ x: BOARD_COLUMNS - 1, y: 0 });
    this.exitSprite = this.add
      .image(exitPosition.x, exitPosition.y, exitTextureKeys[0])
      .setDisplaySize(TILE_SIZE, TILE_SIZE);

    this.syncEntities(game);

    this.input.keyboard?.on('keydown', this.handleKeyDown, this);
    this.unsubscribe = gameStore.subscribe((state, previous) => {
      this.syncEntities(state.game);
      this.syncExit(state.game, previous.game);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const direction = directionFromKey(event.key);

    if (!direction) {
      return;
    }

    event.preventDefault();
    gameStore.getState().dispatch({ type: 'player/move', direction });
  }

  private syncEntities(game: GameState): void {
    const entities = Object.values(game.entities);

    for (const entity of entities.filter((candidate) => candidate.kind === 'box')) {
      this.syncEntity(entity);
    }

    this.syncEntity(game.entities[game.playerId]);

    for (const [id, sprite] of this.entitySprites) {
      if (!game.entities[id]) {
        sprite.destroy();
        this.entitySprites.delete(id);
      }
    }
  }

  private syncEntity(entity: Entity): void {
    const position = toPixel(entity.position);
    const texture = entity.kind === 'player' ? 'player' : 'box';
    let sprite = this.entitySprites.get(entity.id);

    if (!sprite) {
      sprite = this.add.image(position.x, position.y, texture).setDisplaySize(TILE_SIZE, TILE_SIZE);
      this.entitySprites.set(entity.id, sprite);
      return;
    }

    sprite.setPosition(position.x, position.y);
  }

  private syncExit(game: GameState, previous: GameState): void {
    if (game.status === 'completed' && previous.status !== 'completed') {
      this.playExitAnimation();
    }

    if (game.status === 'playing' && previous.status === 'completed') {
      this.exitSprite?.setTexture(exitTextureKeys[0]);
    }
  }

  private playExitAnimation(): void {
    exitTextureKeys.forEach((texture, index) => {
      this.time.delayedCall(index * 180, () => {
        this.exitSprite?.setTexture(texture);
      });
    });
  }

  private shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.input.keyboard?.off('keydown', this.handleKeyDown, this);
  }
}
