import { createChapterScene } from "./scenes/chapter/controller";
import { createClearScene } from "./scenes/clear/controller";
import { createGameScene } from "./scenes/game/controller";
import { createIntroScene } from "./scenes/intro/controller";
import { createStageSelectScene } from "./scenes/stage-select/controller";
import { createStartScene } from "./scenes/start/controller";
import { nextSelection, type PlaySelection } from "./stages";

export class GameApp {
  private disposeScene?: () => void;

  constructor(private readonly root: HTMLElement) {
    if (import.meta.env.DEV) document.addEventListener("keydown", this.handleDevShortcut);
    this.showIntro();
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

  private show(scene: { view: HTMLElement; dispose(): void }): void {
    this.disposeScene?.();
    this.disposeScene = scene.dispose;
    this.root.replaceChildren();
    const frame = document.createElement("div");
    frame.className = "game-frame";
    frame.append(scene.view);
    this.root.append(frame);
  }

  private showIntro = (): void => {
    this.show(createIntroScene(this.showGameStart));
  };

  showGameStart = (): void => {
    this.show(createStartScene(this.showGroups));
  };

  showGroups = (): void => {
    this.showChapter(0);
  };

  private showChapter = (chapterIndex: number): void =>
    this.show(createChapterScene(chapterIndex, this.showStageSelect));
  private showStageSelect = (chapterIndex: number): void =>
    this.show(
      createStageSelectScene(
        chapterIndex,
        (stageIndex) => this.showGame({ chapterIndex, stageIndex }),
        () => this.showChapter(chapterIndex),
      ),
    );
  private showGame = (selection: PlaySelection): void =>
    this.show(createGameScene(selection, this.showGameStart, () => this.showClear(selection)));
  private showClear = (selection: PlaySelection): void =>
    this.show(
      createClearScene(
        () => this.showGame(nextSelection(selection)),
        () => this.showGame(selection),
        this.showGameStart,
      ),
    );
}
