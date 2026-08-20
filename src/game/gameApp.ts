import type Phaser from 'phaser';

import { createPhaserGame } from './createGame';
import { createIntroScene } from './scenes/IntroScene.vn';
import { createStartScene } from './scenes/StartScene.vn';

export class GameApp {
  private game?: Phaser.Game;
  private disposeStartScene?: () => void;

  constructor(private readonly root: HTMLElement) {
    if (import.meta.env.DEV) document.addEventListener('keydown', this.handleDevShortcut);
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

  private clear(): void {
    this.disposeStartScene?.();
    this.disposeStartScene = undefined;
    this.game?.destroy(true);
    this.game = undefined;
    this.root.replaceChildren();
  }

  private showIntro = (): void => {
    this.clear();
    this.root.append(createIntroScene(this.showGameStart));
  };

  showGameStart = (): void => {
    this.clear();
    const startScene = createStartScene(this.showGroups);
    this.disposeStartScene = startScene.dispose;
    this.root.append(startScene.view);
  };

  showGroups = (): void => {
    this.clear();
    const play = document.createElement('main');
    play.className = 'phaser-play';
    play.setAttribute('aria-label', '챕터 선택');
    this.root.append(play);
    this.game = createPhaserGame(play, { onExitHome: this.showGameStart });
  };
}
