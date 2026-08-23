import { allGameAssetUrls } from "@/src/game/assets";
import { preloadAssets } from "@/src/game/preload";
import { createChapterScene } from "@/src/game/scenes/chapter/controller";
import { createClearScene } from "@/src/game/scenes/clear/controller";
import { createGameScene } from "@/src/game/scenes/game/controller";
import { createStageSelectScene } from "@/src/game/scenes/stage-select/controller";
import { createStartScene } from "@/src/game/scenes/start/controller";
import { nextSelection, type PlaySelection } from "@/src/game/stages";
import { progressStore } from "@/src/game/store/progressStore";

export class GameApp {
  private disposeScene?: () => void;
  private frame?: HTMLElement;
  private preloadPromise?: Promise<void>;

  constructor(private readonly root: HTMLElement) {
    if (import.meta.env.DEV) document.addEventListener("keydown", this.handleDevShortcut);
    const startScene = createStartScene(this.showGroups);
    this.mount(startScene);
    this.preloadPromise = preloadAssets(allGameAssetUrls(), startScene.updateLoading);
  }

  private handleDevShortcut = (event: KeyboardEvent): void => {
    if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || event.repeat) return;

    const screens: Record<string, () => void> = {
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
    this.mount(scene);
  }

  private mount(scene: { view: HTMLElement; dispose(): void }): void {
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

  showGameStart = (): void => {
    this.show(createStartScene(this.showGroups, true));
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
