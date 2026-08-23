import { allGameAssetUrls } from "./assets";
import { createChapterScene } from "./scenes/chapter/controller";
import { createClearScene } from "./scenes/clear/controller";
import { createGameScene } from "./scenes/game/controller";
import { createIntroScene } from "./scenes/intro/controller";
import { createStageSelectScene } from "./scenes/stage-select/controller";
import { createStartScene } from "./scenes/start/controller";
import { nextSelection, type PlaySelection } from "./stages";
import { progressStore } from "./store/progressStore";
import { preloadAssets } from "./preload";

export class GameApp {
  private disposeScene?: () => void;
  private frame?: HTMLElement;
  private preloadPromise?: Promise<void>;

  constructor(private readonly root: HTMLElement) {
    if (import.meta.env.DEV) document.addEventListener("keydown", this.handleDevShortcut);
    this.showIntro();
    this.preloadPromise = preloadAssets(allGameAssetUrls());
  }

  private handleDevShortcut = (event: KeyboardEvent): void => {
    if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || event.repeat) return;

    const screens: Record<string, () => void> = {
      Digit0: this.showIntro,
      Digit1: this.showGameStart,
      Digit2: this.showGroups,
    };
    const showScreen = screens[event.code];
    if (!showScreen) return;

    event.preventDefault();
    showScreen();
  };

  private async show(scene: { view: HTMLElement; dispose(): void }): Promise<void> {
    await this.preloadPromise;
    this.disposeScene?.();
    this.disposeScene = scene.dispose;
    this.root.replaceChildren();
    const frame = document.createElement("div");
    frame.className = "game-frame";
    frame.append(scene.view);
    this.frame = frame;
    this.root.append(frame);
  }

  private showOverlay = (scene: { view: HTMLElement; dispose(): void }): Promise<void> =>
    (this.preloadPromise ?? Promise.resolve()).then(() => {
      const previousDispose = this.disposeScene;
      this.disposeScene = () => {
        scene.dispose();
        previousDispose?.();
      };
      const overlay = document.createElement("div");
      overlay.className = "game-overlay";
      overlay.append(scene.view);
      this.frame?.append(overlay);
    });

  private showIntro = (): void => {
    this.show(createIntroScene(this.showGameStart));
  };

  showGameStart = (): void => {
    this.show(createStartScene(this.showGroups));
  };

  showGroups = (): void => {
    this.showChapter(0);
  };

  private showChapter = (chapterIndex: number): Promise<void> =>
    this.show(createChapterScene(chapterIndex, this.showStageSelect));
  private showStageSelect = (chapterIndex: number): Promise<void> =>
    this.show(
      createStageSelectScene(
        chapterIndex,
        (stageIndex) => this.showGame({ chapterIndex, stageIndex }),
        () => this.showChapter(chapterIndex),
      ),
    );
  private showGame = (selection: PlaySelection): Promise<void> =>
    this.show(createGameScene(selection, () => this.showClear(selection)));
  private showClear = (selection: PlaySelection): void => {
    progressStore.markCleared(selection.chapterIndex, selection.stageIndex);
    this.showOverlay(
      createClearScene(
        () => this.showGame(nextSelection(selection)),
        () => this.showGame(selection),
        this.showGameStart,
      ),
    );
  };
}
