import Phaser from "phaser";

import { ChapterScene } from "./scenes/ChapterScene";
import { ClearScene } from "./scenes/ClearScene";
import { GameScene } from "./scenes/GameScene";
import { StageSelectScene } from "./scenes/StageSelectScene";
import type { PlaySelection } from "./stages";

export interface PhaserGameOptions {
  initialSelection?: PlaySelection;
  onExitHome?: () => void;
}

export function createPhaserGame(
  parent: string | HTMLElement,
  options: PhaserGameOptions = {},
): Phaser.Game {
  const onExitHome = options.onExitHome ?? (() => {});
  const chapterScene = new ChapterScene();
  const gameScene = new GameScene(onExitHome, options.initialSelection);
  const stageSelectScene = new StageSelectScene();
  const clearScene = new ClearScene(onExitHome);

  return new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: 1920,
    height: 1080,
    backgroundColor: "#080e14",
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1920,
      height: 1080,
    },
    scene: options.initialSelection
      ? [gameScene, chapterScene, stageSelectScene, clearScene]
      : [chapterScene, stageSelectScene, gameScene, clearScene],
  });
}
