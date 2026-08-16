import Phaser from 'phaser';

import { TILE_SIZE } from '../domain/level';
import { directionFromKey } from '../input';
import { playerTextureForMove, playerTextureKeys } from '../playerAppearance';
import { gameStore, type GameStoreApi } from '../store/gameStore';
import type { Direction, Entity, GameState, Position } from '../domain/types';
import { isGateOpen } from '../domain/decider';

const textureUrls = {
  tile: new URL('../../../assets/tail/tile.96.png', import.meta.url).href,
  box: new URL('../../../assets/box/box.3d.96.png', import.meta.url).href,
  playerDefault: new URL('../../../assets/playable/player_default.96.png', import.meta.url).href,
  playerUp: new URL('../../../assets/playable/player_up.96.png', import.meta.url).href,
  playerDown: new URL('../../../assets/playable/player_down.96.png', import.meta.url).href,
  playerLeft: new URL('../../../assets/playable/player_left.96.png', import.meta.url).href,
  playerRight: new URL('../../../assets/playable/player_right.96.png', import.meta.url).href,
  goal1: new URL('../../../assets/goal/goal_1f.96.png', import.meta.url).href,
  goal2: new URL('../../../assets/goal/goal_2f.96.png', import.meta.url).href,
  goal3: new URL('../../../assets/goal/goal_3f.96.png', import.meta.url).href,
  goal4: new URL('../../../assets/goal/goal_4f.96.png', import.meta.url).href,
  arrowUp: new URL('../../../assets/arrow/arrow_up.svg', import.meta.url).href,
  arrowDown: new URL('../../../assets/arrow/arrow_down.svg', import.meta.url).href,
  arrowLeft: new URL('../../../assets/arrow/arrow_left.svg', import.meta.url).href,
  arrowRight: new URL('../../../assets/arrow/arrow_right.svg', import.meta.url).href,
};

const goalTextureKeys = ['goal-1', 'goal-2', 'goal-3', 'goal-4'];
const arrowTextureKeys: Record<Direction, string> = {
  up: 'arrow-up',
  down: 'arrow-down',
  left: 'arrow-left',
  right: 'arrow-right',
};

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
  private goalSprite?: Phaser.GameObjects.Image;
  private unsubscribe?: () => void;

  constructor(store: GameStoreApi = gameStore) {
    super('game');
    this.store = store;
  }

  preload(): void {
    this.load.image('tile', textureUrls.tile);
    this.load.image('box', textureUrls.box);
    this.load.image(playerTextureKeys.default, textureUrls.playerDefault);
    this.load.image(playerTextureKeys.up, textureUrls.playerUp);
    this.load.image(playerTextureKeys.down, textureUrls.playerDown);
    this.load.image(playerTextureKeys.left, textureUrls.playerLeft);
    this.load.image(playerTextureKeys.right, textureUrls.playerRight);
    this.load.image(goalTextureKeys[0], textureUrls.goal1);
    this.load.image(goalTextureKeys[1], textureUrls.goal2);
    this.load.image(goalTextureKeys[2], textureUrls.goal3);
    this.load.image(goalTextureKeys[3], textureUrls.goal4);
    this.load.image(arrowTextureKeys.up, textureUrls.arrowUp);
    this.load.image(arrowTextureKeys.down, textureUrls.arrowDown);
    this.load.image(arrowTextureKeys.left, textureUrls.arrowLeft);
    this.load.image(arrowTextureKeys.right, textureUrls.arrowRight);
  }

  create(): void {
    const game = this.store.getState().game;
    this.syncTiles(game);

    const goalPosition = toPixel(this.findGoal(game));
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

    const direction = directionFromKey(event.key);

    if (!direction) {
      return;
    }

    event.preventDefault();
    const game = this.store.getState().game;
    const decision = this.store.getState().dispatch({ type: 'player/move', direction });
    this.entitySprites.get(game.playerId)?.setTexture(playerTextureForMove(game, direction, decision));
  }

  private findGoal(game: GameState): Position {
    for (let y = 0; y < game.rows; y += 1) {
      const x = game.tiles[y].indexOf('exit');
      if (x >= 0) {
        return { x, y };
      }
    }

    return { x: 0, y: 0 };
  }

  private syncTiles(game: GameState): void {
    for (let y = 0; y < game.rows; y += 1) {
      for (let x = 0; x < game.columns; x += 1) {
        const key = `${x},${y}`;
        const tile = game.tiles[y][x];
        if (tile === 'blank') {
          this.tileSprites.get(key)?.destroy();
          this.tileSprites.delete(key);
          continue;
        }

        const position = toPixel({ x, y });
        let sprite = this.tileSprites.get(key);

        if (!sprite) {
          sprite = this.add.image(position.x, position.y, 'tile').setDisplaySize(TILE_SIZE, TILE_SIZE);
          this.tileSprites.set(key, sprite);
        }

        const tint = tile === 'wall'
          ? 0x526477
          : tile === 'plate'
            ? game.plateStates[key] === 'active' ? 0x5ee6a8 : 0xd5a84c
            : tile === 'exit'
              ? 0x87b7ff
              : tile === 'wormhole'
                ? 0x9b7cff
                : tile === 'gate' ? isGateOpen(game) ? 0x5ee6a8 : 0x526477 : 0xffffff;
        sprite.setTint(tint);
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
          sprite = this.add.image(position.x, position.y, arrowTextureKeys[direction]);
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
    const texture = entity.kind === 'player' ? playerTextureKeys.default : 'box';
    let sprite = this.entitySprites.get(entity.id);

    if (!sprite) {
      sprite = this.add.image(position.x, position.y, texture).setDisplaySize(TILE_SIZE, TILE_SIZE);
      this.entitySprites.set(entity.id, sprite);
      return;
    }

    sprite.setPosition(position.x, position.y);
  }

  private syncGoal(game: GameState, previous: GameState): void {
    if (game.goalOpened && !previous.goalOpened) {
      this.playGoalAnimation();
    }

    if (!game.goalOpened && previous.goalOpened) {
      this.goalSprite?.setTexture(goalTextureKeys[0]);
    }
  }

  private playGoalAnimation(): void {
    goalTextureKeys.forEach((texture, index) => {
      this.time.delayedCall(index * 180, () => {
        this.goalSprite?.setTexture(texture);
      });
    });
  }

  private shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.input.keyboard?.off('keydown', this.handleKeyDown, this);
  }
}
