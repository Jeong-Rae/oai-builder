import Phaser from 'phaser';

import { TILE_SIZE } from '../domain/level';
import { findExit } from '../features/fields/exit/rules';
import {
  assetForDirection,
  assetUrls,
  gameTextureSlots,
  goalAssetSlots,
  playerTextureForMove,
  textureForEntity,
  textureForField,
} from '../features/presentation';
import { directionFromKey, isUndoShortcut } from '../input';
import { gameStore, type GameStoreApi } from '../store/gameStore';
import type { Entity, GameState } from '../domain/types';

const goalTextureKeys = goalAssetSlots;

function toPixel(position: { x: number; y: number }) {
  return {
    x: position.x * TILE_SIZE + TILE_SIZE / 2,
    y: position.y * TILE_SIZE + TILE_SIZE / 2,
  };
}

export class GameScene extends Phaser.Scene {
  private readonly store: GameStoreApi;
  private readonly entitySprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly controlSprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly tileSprites = new Map<string, Phaser.GameObjects.Image>();
  private goalAnimationTimers: Phaser.Time.TimerEvent[] = [];
  private goalSprite?: Phaser.GameObjects.Image;
  private unsubscribe?: () => void;

  constructor(store: GameStoreApi = gameStore) {
    super('game');
    this.store = store;
  }

  preload(): void {
    gameTextureSlots.forEach((slot) => this.load.image(slot, assetUrls[slot]));
  }

  create(): void {
    const game = this.store.getState().game;
    this.syncTiles(game);

    const goalPosition = toPixel(findExit(game));
    this.goalSprite = this.add
      .image(goalPosition.x, goalPosition.y, goalTextureKeys[game.goalOpened ? 3 : 0])
      .setDisplaySize(TILE_SIZE, TILE_SIZE);

    this.syncEntities(game);

    this.input.keyboard?.on('keydown', this.handleKeyDown, this);
    this.unsubscribe = this.store.subscribe((state, previous) => {
      this.syncTiles(state.game);
      this.syncEntities(state.game);
      this.syncGoal(state.game, previous.game);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.store.getState().game.status === 'completed') return;

    if (isUndoShortcut(event)) {
      event.preventDefault();
      this.store.getState().undo();
      return;
    }

    const direction = directionFromKey(event.key);

    if (!direction) {
      return;
    }

    event.preventDefault();
    const game = this.store.getState().game;
    const decision = this.store.getState().dispatch({ type: 'player/move', direction });
    this.entitySprites.get(game.playerId)?.setTexture(playerTextureForMove(game, direction, decision));
  }

  private syncTiles(game: GameState): void {
    for (let y = 0; y < game.rows; y += 1) {
      for (let x = 0; x < game.columns; x += 1) {
        const key = `${x},${y}`;
        const tile = game.tiles[y][x];
        const texture = textureForField(tile, game, key);
        if (!texture) {
          this.tileSprites.get(key)?.destroy();
          this.tileSprites.delete(key);
          continue;
        }

        const position = toPixel({ x, y });
        let sprite = this.tileSprites.get(key);

        if (!sprite) {
          sprite = this.add.image(position.x, position.y, texture).setDisplaySize(TILE_SIZE, TILE_SIZE);
          this.tileSprites.set(key, sprite);
        } else {
          sprite.setTexture(texture);
        }

      }
    }
  }

  private syncEntities(game: GameState): void {
    const entities = Object.values(game.entities);

    for (const entity of entities.filter((candidate) => candidate.kind !== 'player')) {
      this.syncEntity(entity);
    }

    this.syncEntity(game.entities[game.playerId]);

    this.syncControls(entities);

    for (const [id, sprite] of this.entitySprites) {
      if (!game.entities[id]) {
        sprite.destroy();
        this.entitySprites.delete(id);
      }
    }
  }

  private syncControls(entities: Entity[]): void {
    const active = new Set<string>();

    for (const entity of entities) {
      const position = toPixel(entity.position);
      const count = entity.controls.length;

      entity.controls.forEach((direction, index) => {
        const key = `${entity.id}:${direction}`;
        const offset = (index - (count - 1) / 2) * 18;
        let sprite = this.controlSprites.get(key);

        if (!sprite) {
          sprite = this.add.image(position.x, position.y, assetForDirection(direction));
          this.controlSprites.set(key, sprite);
        }

        sprite.setDisplaySize(20, 20).setPosition(position.x + offset, position.y - 28).setDepth(1);
        active.add(key);
      });
    }

    for (const [key, sprite] of this.controlSprites) {
      if (!active.has(key)) {
        sprite.destroy();
        this.controlSprites.delete(key);
      }
    }
  }

  private syncEntity(entity: Entity): void {
    const position = toPixel(entity.position);
    const texture = textureForEntity(entity);
    let sprite = this.entitySprites.get(entity.id);

    if (!sprite) {
      sprite = this.add.image(position.x, position.y, texture).setDisplaySize(TILE_SIZE, TILE_SIZE);
      this.entitySprites.set(entity.id, sprite);
      return;
    }

    sprite.setTexture(texture).setPosition(position.x, position.y);
  }

  private syncGoal(game: GameState, previous: GameState): void {
    if (game.goalOpened && !previous.goalOpened) {
      this.playGoalAnimation();
    }

    if (!game.goalOpened && previous.goalOpened) {
      this.stopGoalAnimation();
      this.goalSprite?.setTexture(goalTextureKeys[0]);
    }
  }

  private playGoalAnimation(): void {
    this.stopGoalAnimation();
    this.goalAnimationTimers = goalTextureKeys.map((texture, index) =>
      this.time.delayedCall(index * 180, () => {
        this.goalSprite?.setTexture(texture);
      }),
    );
  }

  private stopGoalAnimation(): void {
    this.goalAnimationTimers.forEach((timer) => this.time.removeEvent(timer));
    this.goalAnimationTimers = [];
  }

  private shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.stopGoalAnimation();
    this.input.keyboard?.off('keydown', this.handleKeyDown, this);
  }
}
