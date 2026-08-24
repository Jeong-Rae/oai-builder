import type { GameState, Position } from "@/src/game/domain/types";
import type { HintTarget } from "@/src/game/domain/pathfinder";
import { gateOrientationFor, gateVisualFor } from "@/src/game/features/fields/gate/presentation";
import { platePressFrames } from "@/src/game/features/fields/plate/presentation";
import {
  assetForDirection,
  assetUrls,
  overlayForField,
  textureForEntity,
  textureForField,
} from "@/src/game/features/presentation";
import type { AssetSlot } from "@/src/game/features/presentationTypes";
import { backgroundUrl, clearAssets, stageSelectAssets } from "@/src/game/assets";
import { formatDuration } from "@/src/game/challenge";
import { createBackButton } from "@/src/game/components/BackButton";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import styles from "@/src/game/scenes/game/scene.module.css";

const key = ({ x, y }: Position) => `${x},${y}`;
const goalFrames = ["goalActive"] as const;
const normalFrames = ["normalInactive", "normalActive"] as const;
const gateFrames = ["gateWarn", "gateSafe"] as const;
const goalSparks = [
  [8, 18, 0, 11],
  [45, 3, 180, 8],
  [88, 17, 360, 10],
  [96, 58, 540, 8],
  [74, 94, 720, 11],
  [31, 97, 900, 8],
  [3, 66, 1_080, 10],
] as const;

function selectStateAsset(container: HTMLElement, source: string): void {
  const url = assetUrls[source as AssetSlot] ?? source;
  container.querySelectorAll<HTMLImageElement>(`.${styles.stateAsset}`).forEach((image) => {
    const active = image.dataset.source === url;
    image.classList.toggle(styles.stateAssetActive, active);
    image.setAttribute("aria-hidden", String(!active));
  });
}

function createStateAsset(
  frames: readonly AssetSlot[],
  source: AssetSlot,
  className: string,
  label = "",
  imageClassName = styles.stateAssetFill,
): HTMLElement {
  const container = document.createElement("span");
  container.className = className;
  if (label) {
    container.setAttribute("role", "img");
    container.setAttribute("aria-label", label);
  } else {
    container.setAttribute("aria-hidden", "true");
  }
  frames.forEach((frame) => {
    const image = document.createElement("img");
    image.className = `${styles.stateAsset} ${imageClassName}`;
    image.dataset.source = assetUrls[frame];
    image.src = assetUrls[frame];
    image.alt = "";
    container.append(image);
  });
  selectStateAsset(container, source);
  return container;
}

function createGoalEffect(): HTMLElement {
  const effect = document.createElement("span");
  effect.className = styles.goalEffect;
  effect.setAttribute("aria-hidden", "true");
  effect.append(createGoalGlow(), ...goalSparks.map(createGoalSpark));
  return effect;
}

function createGoalGlow(): HTMLElement {
  const glow = document.createElement("span");
  glow.className = styles.goalGlow;
  return glow;
}

function createGoalSpark([x, y, delay, size]: (typeof goalSparks)[number]): HTMLImageElement {
  const spark = document.createElement("img");
  spark.className = styles.goalSpark;
  spark.src = clearAssets.spark;
  spark.alt = "";
  spark.style.setProperty("--x", `${x}%`);
  spark.style.setProperty("--y", `${y}%`);
  spark.style.setProperty("--delay", `${delay}ms`);
  spark.style.setProperty("--size", `${size}%`);
  return spark;
}

export interface GameView {
  root: HTMLElement;
  sync(game: GameState): void;
  playWormhole(entityId: string, entry: Position, destination: Position): Promise<void>;
  cancelAnimations(): void;
  setActionAvailability(undoEnabled: boolean, navigationEnabled: boolean): void;
  setHintTarget(target?: HintTarget): void;
  setElapsedMs(durationMs: number): void;
  setPlayerTexture(source: string): void;
  setPlateFrame(position: Position, source: string): void;
  showError(onRetry: () => void): void;
}

export function createGameView(
  onBack: () => void,
  onUndo: () => void,
  onReset: () => void,
  onHint: () => void,
  timed = false,
): GameView {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  root.append(createBackgroundStars());
  const navigation = document.createElement("nav");
  navigation.className = styles.navigation;
  navigation.setAttribute("aria-label", "게임 조작");
  const back = createBackButton("스테이지 선택으로 돌아가기", onBack, styles.navigationButton);
  const undo = document.createElement("button");
  undo.type = "button";
  undo.className = styles.navigationButton;
  undo.setAttribute("aria-label", "마지막 이동 되돌리기");
  undo.style.backgroundImage = `url(${stageSelectAssets.backFrame})`;
  undo.disabled = true;
  const undoIcon = document.createElement("span");
  undoIcon.className = styles.actionIcon;
  undoIcon.setAttribute("aria-hidden", "true");
  undoIcon.textContent = "↶";
  undo.append(undoIcon);
  undo.addEventListener("click", onUndo);
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = styles.navigationButton;
  reset.setAttribute("aria-label", "스테이지 처음부터 다시하기");
  reset.style.backgroundImage = `url(${stageSelectAssets.backFrame})`;
  reset.disabled = true;
  const resetIcon = document.createElement("span");
  resetIcon.className = styles.actionIcon;
  resetIcon.setAttribute("aria-hidden", "true");
  resetIcon.textContent = "↻";
  reset.append(resetIcon);
  reset.addEventListener("click", onReset);
  const hint = document.createElement("button");
  hint.type = "button";
  hint.className = `${styles.navigationButton} ${styles.hintButton}`;
  hint.setAttribute("aria-label", "다음 상호작용 힌트 보기");
  hint.style.backgroundImage = `url(${stageSelectAssets.backFrame})`;
  const hintIcon = document.createElement("span");
  hintIcon.className = styles.actionIcon;
  hintIcon.setAttribute("aria-hidden", "true");
  hintIcon.textContent = "?";
  const hintBubble = document.createElement("span");
  hintBubble.className = styles.hintBubble;
  hintBubble.setAttribute("aria-hidden", "true");
  hintBubble.textContent = "hint(demo)";
  hintBubble.style.backgroundImage = `url(${stageSelectAssets.bubbleNext})`;
  hint.append(hintIcon, hintBubble);
  hint.addEventListener("click", onHint);
  navigation.append(back, undo, reset, hint);
  root.append(navigation);
  const timer = document.createElement("output");
  timer.className = styles.timer;
  timer.setAttribute("aria-label", "챌린지 경과 시간");
  timer.value = formatDuration(0);
  timer.hidden = !timed;
  root.append(timer);
  const board = document.createElement("div");
  board.className = styles.board;
  root.append(board);
  const cells = new Map<string, HTMLElement>();
  const entityNodes = new Map<string, HTMLElement>();
  const entityLayers = new Map<string, HTMLElement>();
  const overlays = new Map<string, HTMLElement>();
  const animations = new Set<Animation>();
  const hintRing = document.createElement("span");
  hintRing.className = styles.hintRing;
  hintRing.setAttribute("aria-hidden", "true");
  let animationGeneration = 0;
  let dimensions = "";
  const build = (game: GameState) => {
    dimensions = `${game.columns}x${game.rows}`;
    board.replaceChildren();
    cells.clear();
    entityNodes.clear();
    entityLayers.clear();
    overlays.clear();
    board.style.setProperty("--columns", String(game.columns));
    board.style.setProperty("--rows", String(game.rows));
    for (let y = 0; y < game.rows; y += 1)
      for (let x = 0; x < game.columns; x += 1) {
        const cell = document.createElement("div");
        cell.className = styles.cell;
        cells.set(`${x},${y}`, cell);
        board.append(cell);
      }
  };
  const syncBaseTexture = (cell: HTMLElement, texture: ReturnType<typeof textureForField>) => {
    let base = cell.querySelector<HTMLImageElement>(`.${styles.base}`);
    if (!texture) {
      base?.remove();
      return;
    }
    if (!base) {
      base = document.createElement("img");
      base.className = styles.base;
      base.alt = "";
      cell.prepend(base);
    }
    base.src = assetUrls[texture];
  };
  const syncFieldOverlay = (cell: HTMLElement, game: GameState, position: Position) => {
    const positionKey = key(position);
    const overlayTexture = overlayForField(game.tiles[position.y]![position.x]!, game, positionKey);
    const old = overlays.get(positionKey);
    if (!overlayTexture) {
      old?.remove();
      overlays.delete(positionKey);
      return;
    }
    const overlayKind = game.tiles[position.y]![position.x];
    const className =
      overlayKind === "plate"
        ? `${styles.overlay} ${styles.plate}`
        : overlayKind === "wormhole"
          ? `${styles.overlay} ${styles.wormhole}`
          : overlayKind === "exit"
            ? `${styles.overlay} ${styles.goal}`
            : styles.overlay;
    const overlay =
      old ??
      (overlayKind === "plate"
        ? createStateAsset(platePressFrames, overlayTexture, className)
        : overlayKind === "exit"
          ? createStateAsset(goalFrames, overlayTexture, className, "목표")
          : document.createElement("img"));
    overlay.className = className;
    if (overlayKind === "plate" || overlayKind === "exit") {
      selectStateAsset(overlay, overlayTexture);
    } else {
      const image = overlay as HTMLImageElement;
      image.alt = "";
      image.src = assetUrls[overlayTexture];
    }
    if (!old) {
      cell.append(overlay);
      overlays.set(positionKey, overlay);
    }
  };
  const syncGoalEffect = (cell: HTMLElement, active: boolean) => {
    cell.classList.toggle(styles.goalActive, active);
    const goalEffect = cell.querySelector(`.${styles.goalEffect}`);
    if (active && !goalEffect) cell.append(createGoalEffect());
    else if (!active) goalEffect?.remove();
  };
  const syncCell = (cell: HTMLElement, game: GameState, position: Position) => {
    const field = game.tiles[position.y]![position.x]!;
    syncBaseTexture(cell, textureForField(field, game, key(position)));
    syncFieldOverlay(cell, game, position);
    syncGoalEffect(cell, field === "exit" && game.status === "playing");
    if (field === "gate") renderGate(cell, game, position);
    else cell.querySelector(`.${styles.gate}`)?.remove();
  };
  const syncBoardCells = (game: GameState) => {
    for (let y = 0; y < game.rows; y += 1)
      for (let x = 0; x < game.columns; x += 1) {
        const position = { x, y };
        const cell = cells.get(key(position))!;
        syncCell(cell, game, position);
      }
  };
  const syncEntityControls = (layer: HTMLElement, entity: GameState["entities"][string]) => {
    layer.querySelectorAll(`.${styles.control}`).forEach((node) => node.remove());
    entity.controls.forEach((direction) => {
      const control = document.createElement("img");
      control.className = styles.control;
      control.dataset.direction = direction;
      control.src = assetUrls[assetForDirection(direction)];
      control.alt = "";
      layer.append(control);
    });
  };
  const syncEntities = (game: GameState) => {
    const present = new Set<string>();
    Object.values(game.entities).forEach((entity) => {
      present.add(entity.id);
      let image = entityNodes.get(entity.id);
      let layer = entityLayers.get(entity.id);
      if (!image) {
        layer = document.createElement("div");
        layer.className =
          entity.kind === "normal"
            ? `${styles.entityLayer} ${styles.normalLayer}`
            : entity.kind === "player"
              ? `${styles.entityLayer} ${styles.playerLayer}`
              : styles.entityLayer;
        image =
          entity.kind === "normal"
            ? createStateAsset(
                normalFrames,
                textureForEntity(entity, game),
                `${styles.entity} ${styles.normal}`,
                entity.kind,
              )
            : document.createElement("img");
        if (image instanceof HTMLImageElement) {
          image.className = styles.entity;
          image.alt = entity.kind === "player" ? "플레이어" : entity.kind;
        }
        layer.append(image);
        entityNodes.set(entity.id, image);
        entityLayers.set(entity.id, layer);
      }
      layer!.classList.toggle(
        styles.playerHappy,
        entity.kind === "player" && game.status === "completed",
      );
      const texture = textureForEntity(entity, game);
      if (entity.kind === "normal") selectStateAsset(image, texture);
      else (image as HTMLImageElement).src = assetUrls[texture];
      syncEntityControls(layer!, entity);
      cells.get(key(entity.position))!.append(layer!);
    });
    entityNodes.forEach((image, id) => {
      if (!present.has(id)) {
        entityLayers.get(id)?.remove();
        entityNodes.delete(id);
        entityLayers.delete(id);
      }
    });
  };
  const sync = (game: GameState) => {
    if (dimensions !== `${game.columns}x${game.rows}`) build(game);
    syncBoardCells(game);
    syncEntities(game);
  };
  const track = (animation: Animation): Animation => {
    animations.add(animation);
    return animation;
  };
  const finish = (animation: Animation): Promise<void> =>
    animation.finished.then(
      () => undefined,
      () => undefined,
    );
  const stop = (animation: Animation): void => {
    animation.cancel();
    animations.delete(animation);
  };
  const cancelAnimations = () => {
    animationGeneration += 1;
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  };
  return {
    root,
    sync,
    playWormhole: async (entityId, entry, destination) => {
      const layer = entityLayers.get(entityId);
      const entryCell = cells.get(key(entry));
      const destinationCell = cells.get(key(destination));
      if (!layer || !entryCell || !destinationCell) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        destinationCell.append(layer);
        return;
      }

      const generation = animationGeneration;
      entryCell.append(layer);
      const disappear = track(
        layer.animate(
          [
            { clipPath: "inset(0 0 0 0)", opacity: 1 },
            { clipPath: "inset(0 0 0 0)", opacity: 1, offset: 0.18 },
            { clipPath: "inset(0 0 100% 0)", opacity: 0.15 },
          ],
          { duration: 400, easing: "cubic-bezier(.55, 0, 1, .45)", fill: "both" },
        ),
      );
      await finish(disappear);
      if (generation !== animationGeneration) return;

      destinationCell.append(layer);
      const appear = track(
        layer.animate(
          [
            { clipPath: "inset(100% 0 0 0)", opacity: 0.15 },
            { clipPath: "inset(0 0 0 0)", opacity: 1 },
          ],
          { duration: 400, easing: "cubic-bezier(0, .55, .45, 1)", fill: "both" },
        ),
      );
      stop(disappear);
      await finish(appear);
      stop(appear);
    },
    cancelAnimations,
    setActionAvailability: (undoEnabled, navigationEnabled) => {
      back.disabled = !navigationEnabled;
      undo.disabled = !navigationEnabled || !undoEnabled;
      reset.disabled = !navigationEnabled;
      hint.disabled = !navigationEnabled;
    },
    setHintTarget: (target) => {
      hintRing.remove();
      hintRing.className = styles.hintRing;
      if (!target) return;
      if (target.type === "entity") {
        entityLayers.get(target.entityId)?.append(hintRing);
        return;
      }
      hintRing.classList.add(
        target.field === "plate"
          ? styles.plateHintRing
          : target.field === "wormhole"
            ? styles.wormholeHintRing
            : styles.exitHintRing,
      );
      cells.get(key(target.position))?.append(hintRing);
    },
    setElapsedMs: (durationMs) => {
      timer.value = formatDuration(durationMs);
    },
    setPlayerTexture: (source) => {
      const player = entityNodes.get("player");
      if (player instanceof HTMLImageElement)
        player.src = assetUrls[source as keyof typeof assetUrls] ?? source;
    },
    setPlateFrame: (position, source) => {
      const overlay = overlays.get(key(position));
      if (overlay) selectStateAsset(overlay, source);
    },
    showError: (onRetry) => {
      board.replaceChildren();
      const error = document.createElement("section");
      error.className = styles.error;
      error.innerHTML = "<p>맵을 불러올 수 없습니다.</p>";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "RETRY";
      retry.addEventListener("click", onRetry);
      error.append(retry);
      board.append(error);
    },
  };
}

function renderGate(cell: HTMLElement, game: GameState, position: Position): void {
  const visual = gateVisualFor(game);
  const orientation = gateOrientationFor(game, position);
  let gate = cell.querySelector<HTMLElement>(`.${styles.gate}`);
  if (!gate || gate.dataset.orientation !== orientation) {
    gate?.remove();
    gate = createStateAsset(
      gateFrames,
      visual,
      styles.gate,
      "",
      `${styles.gateAsset} ${orientation === "vertical" ? styles.vertical : ""}`,
    );
    gate.dataset.orientation = orientation;
    cell.append(gate);
  }
  selectStateAsset(gate, visual);
}
