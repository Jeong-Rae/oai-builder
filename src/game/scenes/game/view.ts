import type { GameState, Position } from "../../domain/types";
import { TILE_SIZE } from "../../domain/level";
import { findExit } from "../../features/fields/exit/rules";
import { gateOrientationFor, gateVisualFor } from "../../features/fields/gate/presentation";
import {
  assetForDirection,
  assetUrls,
  overlayForField,
  textureForEntity,
  textureForField,
} from "../../features/presentation";
import { chapters, stageFor, type PlaySelection } from "../../stages";
import { backgroundUrl, goalStarUrl } from "../../assets";
import styles from "./scene.module.css";

const key = ({ x, y }: Position) => `${x},${y}`;

export interface GameView {
  root: HTMLElement;
  sync(game: GameState): void;
  setPlayerTexture(source: string): void;
  setPlateFrame(position: Position, source: string): void;
  showError(onRetry: () => void): void;
}

export function createGameView(selection: PlaySelection, onHome: () => void): GameView {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  const header = document.createElement("header");
  header.className = styles.header;
  header.textContent = `${chapters[selection.chapterIndex]!.sign} · ${stageFor(selection).label}`;
  const home = document.createElement("button");
  home.type = "button";
  home.textContent = "HOME";
  home.className = styles.home;
  home.addEventListener("click", onHome);
  header.append(home);
  root.append(header);
  const board = document.createElement("div");
  board.className = styles.board;
  root.append(board);
  const cells = new Map<string, HTMLElement>();
  const entityNodes = new Map<string, HTMLImageElement>();
  const overlays = new Map<string, HTMLImageElement>();
  let dimensions = "";
  const build = (game: GameState) => {
    dimensions = `${game.columns}x${game.rows}`;
    board.replaceChildren();
    cells.clear();
    entityNodes.clear();
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
          overlay.className = overlayKind === "plate"
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
      if (!image) {
        image = document.createElement("img");
        image.className = entity.kind === "normal"
          ? `${styles.entity} ${styles.normal}`
          : styles.entity;
        image.alt = entity.kind === "player" ? "플레이어" : entity.kind;
        entityNodes.set(entity.id, image);
      }
      image.src = assetUrls[textureForEntity(entity)];
      cells.get(key(entity.position))!.append(image);
      image.parentElement?.querySelectorAll(`.${styles.control}`).forEach((node) => node.remove());
      entity.controls.forEach((direction, index) => {
        const control = document.createElement("img");
        control.className = styles.control;
        control.src = assetUrls[assetForDirection(direction)];
        control.alt = "";
        control.style.setProperty(
          "--control-offset",
          `${((index - (entity.controls.length - 1) / 2) * 18) / TILE_SIZE}`,
        );
        image.parentElement!.append(control);
      });
    });
    entityNodes.forEach((image, id) => {
      if (!present.has(id)) {
        image.remove();
        entityNodes.delete(id);
      }
    });
  };
  return {
    root,
    sync,
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
