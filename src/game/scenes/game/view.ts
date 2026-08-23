import type { GameState, Position } from "@/src/game/domain/types";
import { findExit } from "@/src/game/features/fields/exit/rules";
import { gateOrientationFor, gateVisualFor } from "@/src/game/features/fields/gate/presentation";
import {
  assetForDirection,
  assetUrls,
  overlayForField,
  textureForEntity,
  textureForField,
} from "@/src/game/features/presentation";
import { backgroundUrl, goalStarUrl, stageSelectAssets } from "@/src/game/assets";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import styles from "@/src/game/scenes/game/scene.module.css";

const key = ({ x, y }: Position) => `${x},${y}`;

export interface GameView {
  root: HTMLElement;
  sync(game: GameState): void;
  playWormhole(entityId: string, entry: Position, destination: Position): Promise<void>;
  cancelAnimations(): void;
  setActionAvailability(undoEnabled: boolean, resetEnabled: boolean): void;
  setPlayerTexture(source: string): void;
  setPlateFrame(position: Position, source: string): void;
  showError(onRetry: () => void): void;
}

export function createGameView(
  onBack: () => void,
  onUndo: () => void,
  onReset: () => void,
): GameView {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  root.append(createBackgroundStars());
  const navigation = document.createElement("nav");
  navigation.className = styles.navigation;
  navigation.setAttribute("aria-label", "게임 조작");
  const back = document.createElement("button");
  back.type = "button";
  back.className = styles.navigationButton;
  back.setAttribute("aria-label", "스테이지 선택으로 돌아가기");
  back.style.backgroundImage = `url(${stageSelectAssets.backFrame})`;
  const backIcon = document.createElement("img");
  backIcon.src = stageSelectAssets.arrowBack;
  backIcon.alt = "";
  back.append(backIcon);
  back.addEventListener("click", onBack);
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
  navigation.append(back, undo, reset);
  root.append(navigation);
  const board = document.createElement("div");
  board.className = styles.board;
  root.append(board);
  const cells = new Map<string, HTMLElement>();
  const entityNodes = new Map<string, HTMLImageElement>();
  const entityLayers = new Map<string, HTMLElement>();
  const overlays = new Map<string, HTMLImageElement>();
  const animations = new Set<Animation>();
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
  const sync = (game: GameState) => {
    if (dimensions !== `${game.columns}x${game.rows}`) build(game);
    for (let y = 0; y < game.rows; y += 1)
      for (let x = 0; x < game.columns; x += 1) {
        const position = { x, y };
        const cell = cells.get(key(position))!;
        const texture = textureForField(game.tiles[y]![x]!, game, key(position));
        let base = cell.querySelector<HTMLImageElement>(`.${styles.base}`);
        if (texture) {
          if (!base) {
            base = document.createElement("img");
            base.className = styles.base;
            base.alt = "";
            cell.prepend(base);
          }
          base.src = assetUrls[texture];
        } else base?.remove();
        const overlayTexture =
          game.tiles[y]![x] === "exit"
            ? undefined
            : overlayForField(game.tiles[y]![x]!, game, key(position));
        const old = overlays.get(key(position));
        if (overlayTexture) {
          const overlay = old ?? document.createElement("img");
          const overlayKind = game.tiles[y]![x];
          overlay.className =
            overlayKind === "plate"
              ? `${styles.overlay} ${styles.plate}`
              : overlayKind === "wormhole"
                ? `${styles.overlay} ${styles.wormhole}`
                : styles.overlay;
          overlay.alt = "";
          overlay.src = assetUrls[overlayTexture];
          if (!old) {
            cell.append(overlay);
            overlays.set(key(position), overlay);
          }
        } else {
          old?.remove();
          overlays.delete(key(position));
        }
        if (game.tiles[y]![x] === "gate") renderGate(cell, game, position);
        else cell.querySelector(`.${styles.gate}`)?.remove();
      }
    const exit = cells.get(key(findExit(game)));
    if (exit && !exit.querySelector(`.${styles.goal}`)) {
      const image = document.createElement("img");
      image.className = styles.goal;
      image.src = goalStarUrl;
      image.alt = "목표";
      exit.append(image);
    }
    const present = new Set<string>();
    Object.values(game.entities).forEach((entity) => {
      present.add(entity.id);
      let image = entityNodes.get(entity.id);
      let layer = entityLayers.get(entity.id);
      if (!image) {
        layer = document.createElement("div");
        layer.className = styles.entityLayer;
        image = document.createElement("img");
        image.className =
          entity.kind === "normal" ? `${styles.entity} ${styles.normal}` : styles.entity;
        image.alt = entity.kind === "player" ? "플레이어" : entity.kind;
        layer.append(image);
        entityNodes.set(entity.id, image);
        entityLayers.set(entity.id, layer);
      }
      image.src = assetUrls[textureForEntity(entity)];
      layer!.querySelectorAll(`.${styles.control}`).forEach((node) => node.remove());
      cells.get(key(entity.position))!.append(layer!);
      entity.controls.forEach((direction) => {
        const control = document.createElement("img");
        control.className = styles.control;
        control.dataset.direction = direction;
        control.src = assetUrls[assetForDirection(direction)];
        control.alt = "";
        layer!.append(control);
      });
    });
    entityNodes.forEach((image, id) => {
      if (!present.has(id)) {
        entityLayers.get(id)?.remove();
        entityNodes.delete(id);
        entityLayers.delete(id);
      }
    });
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
            { clipPath: "inset(0 0 0 0)", opacity: 1, transform: "translateY(0) scale(1)" },
            {
              clipPath: "inset(0 0 0 0)",
              opacity: 1,
              transform: "translateY(0) scale(1)",
              offset: 0.18,
            },
            {
              clipPath: "inset(0 0 100% 0)",
              opacity: 0.15,
              transform: "translateY(18%) scale(0.88)",
            },
          ],
          { duration: 400, easing: "cubic-bezier(.55, 0, 1, .45)", fill: "both" },
        ),
      );
      const entryPulse = overlays.get(key(entry))?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
        { duration: 400, easing: "ease-in-out" },
      );
      if (entryPulse) track(entryPulse);
      await Promise.all([finish(disappear), ...(entryPulse ? [finish(entryPulse)] : [])]);
      if (generation !== animationGeneration) return;

      destinationCell.append(layer);
      const appear = track(
        layer.animate(
          [
            {
              clipPath: "inset(100% 0 0 0)",
              opacity: 0.15,
              transform: "translateY(18%) scale(0.88)",
            },
            { clipPath: "inset(0 0 0 0)", opacity: 1, transform: "translateY(0) scale(1)" },
          ],
          { duration: 400, easing: "cubic-bezier(0, .55, .45, 1)", fill: "both" },
        ),
      );
      const exitPulse = overlays.get(key(destination))?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
        { duration: 400, easing: "ease-in-out" },
      );
      if (exitPulse) track(exitPulse);
      stop(disappear);
      if (entryPulse) stop(entryPulse);
      await Promise.all([finish(appear), ...(exitPulse ? [finish(exitPulse)] : [])]);
      stop(appear);
      if (exitPulse) stop(exitPulse);
    },
    cancelAnimations,
    setActionAvailability: (undoEnabled, resetEnabled) => {
      undo.disabled = !undoEnabled;
      reset.disabled = !resetEnabled;
    },
    setPlayerTexture: (source) => {
      const player = entityNodes.get("player");
      if (player) player.src = assetUrls[source as keyof typeof assetUrls] ?? source;
    },
    setPlateFrame: (position, source) => {
      const overlay = overlays.get(key(position));
      if (overlay) overlay.src = assetUrls[source as keyof typeof assetUrls] ?? source;
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
  const signature = `${visual.device}:${visual.laser ?? ""}:${orientation}`;
  const current = cell.querySelector<HTMLElement>(`.${styles.gate}`);
  if (current?.dataset.signature === signature) return;
  current?.remove();
  const gate = document.createElement("div");
  gate.className = styles.gate;
  gate.dataset.signature = signature;
  if (visual.laser) {
    const laser = document.createElement("img");
    laser.className = `${styles.laser} ${orientation === "vertical" ? styles.vertical : ""}`;
    laser.src = assetUrls[visual.laser];
    laser.alt = "";
    gate.append(laser);
  }
  for (const side of ["first", "second"]) {
    const device = document.createElement("img");
    device.className = `${styles.device} ${orientation === "vertical" ? styles.vertical : ""} ${side === "second" ? styles.second : ""}`;
    device.src = assetUrls[visual.device];
    device.alt = "";
    gate.append(device);
  }
  cell.append(gate);
}
