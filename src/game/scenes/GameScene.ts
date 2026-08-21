import Phaser from "phaser";

import { parseMap } from "../../map/mapDocument";
import { TILE_SIZE } from "../domain/level";
import { findExit } from "../features/fields/exit/rules";
import { gateOrientationFor, gateVisualFor } from "../features/fields/gate/presentation";
import { platePressFrames } from "../features/fields/plate/presentation";
import {
  assetForDirection,
  assetUrls,
  fieldPresentations,
  gameTextureSlots,
  playerTextureForMove,
  textureForEntity,
  textureForField,
  overlayForField,
} from "../features/presentation";
import { directionFromKey, isUndoShortcut } from "../input";
import { createGameStoreFromMap, type GameStoreApi } from "../store/gameStore";
import { chapters, stageFor, type PlaySelection } from "../stages";
import type { Entity, GameState, Position } from "../domain/types";

const WIDTH = 1920;
const HEIGHT = 1080;
const fontUrl = new URL("@/assets/fonts/blrrpixs016.ttf", import.meta.url).href;

function toPixel(position: { x: number; y: number }, origin: { x: number; y: number }) {
  return {
    x: origin.x + position.x * TILE_SIZE + TILE_SIZE / 2,
    y: origin.y + position.y * TILE_SIZE + TILE_SIZE / 2,
  };
}

export class GameScene extends Phaser.Scene {
  private store?: GameStoreApi;
  private selection: PlaySelection = { chapterIndex: 0, stageIndex: 0 };
  private origin = { x: 0, y: 0 };
  private readonly entitySprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly controlSprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly tileSprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly fieldOverlaySprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly gateSprites = new Map<string, Phaser.GameObjects.Container>();
  private readonly plateAnimationTimers = new Map<string, Phaser.Time.TimerEvent[]>();
  private unsubscribe?: () => void;
  private completing = false;

  constructor(
    private readonly onExitHome: () => void = () => {},
    private readonly initialSelection?: PlaySelection,
  ) {
    super("game");
  }

  init(data: { selection?: PlaySelection } = {}): void {
    this.selection = data.selection ?? this.initialSelection ?? { chapterIndex: 0, stageIndex: 0 };
  }

  preload(): void {
    gameTextureSlots.forEach((slot) => this.load.image(slot, assetUrls[slot]));
    this.load.font("Blrr Pixs", fontUrl, "truetype");
    this.load.text(this.mapCacheKey(), stageFor(this.selection).mapUrl);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#080e14");
    this.renderHeader();

    const source = this.cache.text.get(this.mapCacheKey());
    const result = typeof source === "string" ? parseMap(source) : undefined;
    if (!result?.ok) {
      this.renderLoadError();
      return;
    }

    this.store = createGameStoreFromMap(result.map);
    const game = this.store.getState().game;
    this.origin = {
      x: (WIDTH - game.columns * TILE_SIZE) / 2,
      y: (HEIGHT - game.rows * TILE_SIZE) / 2,
    };
    this.add
      .rectangle(
        WIDTH / 2,
        HEIGHT / 2,
        game.columns * TILE_SIZE + 12,
        game.rows * TILE_SIZE + 12,
        0x000000,
        0,
      )
      .setStrokeStyle(6, 0xd7f9ff)
      .setDepth(-1);
    this.add
      .rectangle(
        WIDTH / 2,
        HEIGHT / 2,
        game.columns * TILE_SIZE + 20,
        game.rows * TILE_SIZE + 20,
        0x000000,
        0,
      )
      .setStrokeStyle(4, 0x263947)
      .setDepth(-2);
    this.syncTiles(game);

    const goalPosition = toPixel(findExit(game), this.origin);
    this.add
      .image(goalPosition.x, goalPosition.y, "goalStar")
      .setDisplaySize(TILE_SIZE, TILE_SIZE)
      .setDepth(1);

    this.syncEntities(game);

    this.input.keyboard?.on("keydown", this.handleKeyDown, this);
    this.unsubscribe = this.store.subscribe((state, previous) => {
      this.syncTiles(state.game, previous.game);
      this.syncEntities(state.game);
      if (state.game.status === "completed" && previous.game.status !== "completed")
        this.completeStage();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.cameras.main.fadeIn(this.reducedMotion() ? 0 : 180, 8, 14, 20);
  }

  private mapCacheKey(): string {
    return `map-${this.selection.chapterIndex}-${this.selection.stageIndex}`;
  }

  private renderHeader(): void {
    const chapter = chapters[this.selection.chapterIndex]!;
    const stage = stageFor(this.selection);
    this.add.text(48, 42, `${chapter.sign} · ${stage.label}`, {
      color: "#81f0c5",
      fontFamily: "Blrr Pixs",
      fontSize: "24px",
      fontStyle: "bold",
      letterSpacing: 4,
    });
    this.createTextButton(WIDTH - 48, 36, "HOME", this.onExitHome).setOrigin(1, 0);
  }

  private renderLoadError(): void {
    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 48, "맵을 불러올 수 없습니다.", {
        color: "#ffffff",
        fontFamily: "Blrr Pixs",
        fontSize: "36px",
      })
      .setOrigin(0.5);
    this.createTextButton(WIDTH / 2, HEIGHT / 2 + 40, "RETRY", () => {
      this.cache.text.remove(this.mapCacheKey());
      this.scene.restart({ selection: this.selection });
    }).setOrigin(0.5);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  private createTextButton(
    x: number,
    y: number,
    label: string,
    onPress: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        backgroundColor: "#d7f9ff",
        color: "#080e14",
        fontFamily: "Blrr Pixs",
        fontSize: "22px",
        fontStyle: "bold",
        padding: { x: 18, y: 12 },
      })
      .setInteractive({ useHandCursor: true });
    button.on("pointerdown", onPress);
    button.on("pointerover", () => button.setBackgroundColor("#81f0c5"));
    button.on("pointerout", () => button.setBackgroundColor("#d7f9ff"));
    return button;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.store || this.store.getState().game.status === "completed") return;

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
    const decision = this.store.getState().dispatch({ type: "player/move", direction });
    this.entitySprites
      .get(game.playerId)
      ?.setTexture(playerTextureForMove(game, direction, decision));
  }

  private syncTiles(game: GameState, previous?: GameState): void {
    for (let y = 0; y < game.rows; y += 1) {
      for (let x = 0; x < game.columns; x += 1) {
        const key = `${x},${y}`;
        const tile = game.tiles[y][x];
        const texture = textureForField(tile, game, key);
        if (!texture) {
          this.tileSprites.get(key)?.destroy();
          this.tileSprites.delete(key);
          this.fieldOverlaySprites.get(key)?.destroy();
          this.fieldOverlaySprites.delete(key);
          this.gateSprites.get(key)?.destroy();
          this.gateSprites.delete(key);
          this.stopPlateAnimation(key);
          continue;
        }

        const position = toPixel({ x, y }, this.origin);
        let sprite = this.tileSprites.get(key);

        if (!sprite) {
          sprite = this.add
            .image(position.x, position.y, texture)
            .setDisplaySize(TILE_SIZE, TILE_SIZE)
            .setDepth(0);
          this.tileSprites.set(key, sprite);
        } else {
          sprite.setTexture(texture);
        }

        if (tile === "gate") this.syncGate(key, position, game, { x, y });
        else {
          this.gateSprites.get(key)?.destroy();
          this.gateSprites.delete(key);
        }

        // The goal and gate use their own composed sprites.
        const overlayTexture = tile === "exit" ? undefined : overlayForField(tile, game, key);
        let overlay = this.fieldOverlaySprites.get(key);
        const plateStateChanged = previous?.plateStates[key] !== game.plateStates[key];
        if (!overlayTexture) {
          overlay?.destroy();
          this.fieldOverlaySprites.delete(key);
          this.stopPlateAnimation(key);
        } else if (!overlay) {
          overlay = this.add.image(position.x, position.y, overlayTexture).setDepth(1);
          this.sizeFieldOverlay(overlay, tile);
          this.fieldOverlaySprites.set(key, overlay);
        } else if (!previous || plateStateChanged) {
          overlay.setTexture(overlayTexture);
          this.sizeFieldOverlay(overlay, tile);
        }

        if (tile === "plate" && previous && plateStateChanged && overlay) {
          if (game.plateStates[key] === "active") this.playPlatePress(key, overlay);
          else this.stopPlateAnimation(key);
        }
      }
    }
  }

  private playPlatePress(key: string, plate: Phaser.GameObjects.Image): void {
    this.stopPlateAnimation(key);
    if (this.reducedMotion()) {
      plate.setTexture(platePressFrames[2]);
      return;
    }

    plate.setTexture(platePressFrames[0]);
    const timers = platePressFrames.slice(1).map((texture, index) =>
      this.time.delayedCall((index + 1) * 90, () => {
        const overlay = this.fieldOverlaySprites.get(key);
        if (overlay) {
          overlay.setTexture(texture);
          this.sizeFieldOverlay(overlay, "plate");
        }
        if (index === platePressFrames.length - 2) this.plateAnimationTimers.delete(key);
      }),
    );
    this.plateAnimationTimers.set(key, timers);
  }

  private stopPlateAnimation(key: string): void {
    this.plateAnimationTimers.get(key)?.forEach((timer) => this.time.removeEvent(timer));
    this.plateAnimationTimers.delete(key);
  }

  private sizeFieldOverlay(
    overlay: Phaser.GameObjects.Image,
    field: keyof typeof fieldPresentations,
  ): void {
    if (fieldPresentations[field].overlayFit !== "height") {
      overlay.setDisplaySize(TILE_SIZE, TILE_SIZE);
      return;
    }

    const source = overlay.texture.getSourceImage() as { width: number; height: number };
    overlay.setDisplaySize((TILE_SIZE * source.width) / source.height, TILE_SIZE);
  }

  private syncGate(
    key: string,
    position: { x: number; y: number },
    game: GameState,
    tilePosition: Position,
  ): void {
    const visual = gateVisualFor(game);
    const orientation = gateOrientationFor(game, tilePosition);
    const current = this.gateSprites.get(key);
    if (
      current?.getData("safe") === !visual.laser &&
      current.getData("orientation") === orientation
    )
      return;

    current?.destroy();
    const gate = this.add
      .container(position.x, position.y)
      .setDepth(1)
      .setData("safe", !visual.laser)
      .setData("orientation", orientation);
    if (visual.laser) {
      const laser = this.add.image(0, 0, visual.laser).setDisplaySize(TILE_SIZE, TILE_SIZE * 0.38);
      if (orientation === "vertical") laser.setRotation(Math.PI / 2);
      gate.add(laser);
    }
    const deviceOffset = TILE_SIZE * 0.28;
    const first = this.add
      .image(
        orientation === "vertical" ? 0 : -deviceOffset,
        orientation === "vertical" ? -deviceOffset : 0,
        visual.device,
      )
      .setDisplaySize(TILE_SIZE * 0.64, TILE_SIZE * 0.64);
    const second = this.add
      .image(
        orientation === "vertical" ? 0 : deviceOffset,
        orientation === "vertical" ? deviceOffset : 0,
        visual.device,
      )
      .setDisplaySize(TILE_SIZE * 0.64, TILE_SIZE * 0.64);
    if (orientation === "vertical") {
      first.setRotation(Math.PI / 2);
      second.setRotation(-Math.PI / 2);
    } else {
      second.setFlipX(true);
    }
    gate.add([first, second]);
    this.gateSprites.set(key, gate);
  }

  private syncEntities(game: GameState): void {
    const entities = Object.values(game.entities);

    for (const entity of entities.filter((candidate) => candidate.kind !== "player")) {
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
      const position = toPixel(entity.position, this.origin);
      const count = entity.controls.length;

      entity.controls.forEach((direction, index) => {
        const key = `${entity.id}:${direction}`;
        const offset = (index - (count - 1) / 2) * 18;
        let sprite = this.controlSprites.get(key);

        if (!sprite) {
          sprite = this.add.image(position.x, position.y, assetForDirection(direction));
          this.controlSprites.set(key, sprite);
        }

        sprite
          .setDisplaySize(20, 20)
          .setPosition(position.x + offset, position.y - 28)
          .setDepth(3);
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
    const position = toPixel(entity.position, this.origin);
    const texture = textureForEntity(entity);
    let sprite = this.entitySprites.get(entity.id);

    if (!sprite) {
      sprite = this.add
        .image(position.x, position.y, texture)
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .setDepth(2);
      this.entitySprites.set(entity.id, sprite);
      return;
    }

    sprite.setTexture(texture).setPosition(position.x, position.y);
  }

  private completeStage(): void {
    if (this.completing) return;
    this.completing = true;
    this.time.delayedCall(this.reducedMotion() ? 0 : 700, () => {
      this.cameras.main.fadeOut(this.reducedMotion() ? 0 : 180, 8, 14, 20);
      this.time.delayedCall(this.reducedMotion() ? 0 : 180, () => {
        this.scene.start("clear", { selection: this.selection });
      });
    });
  }

  private reducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  private shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.plateAnimationTimers.forEach((timers) =>
      timers.forEach((timer) => this.time.removeEvent(timer)),
    );
    this.plateAnimationTimers.clear();
    this.input.keyboard?.off("keydown", this.handleKeyDown, this);
    this.entitySprites.clear();
    this.controlSprites.clear();
    this.tileSprites.clear();
    this.fieldOverlaySprites.clear();
    this.gateSprites.clear();
    this.store = undefined;
    this.completing = false;
  }
}
