import type Phaser from 'phaser';

import { parseMap } from '../map/mapDocument';
import { createPhaserGame } from './createGame';
import { createIntroScene } from './scenes/IntroScene.vn';
import { createChapterScene } from './scenes/ChapterScene.vn';
import { createStartScene } from './scenes/StartScene.vn';
import { createGameStoreFromMap, type GameStoreApi } from './store/gameStore';
import { nextStage, stageGroups, stagesPerGroup, type Stage } from './stages';

export class GameApp {
  private game?: Phaser.Game;
  private disposeStartScene?: () => void;
  private unsubscribe?: () => void;
  private selectedStage: Stage = { group: 0, index: 0 };

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
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.game?.destroy(true);
    this.game = undefined;
    this.root.replaceChildren();
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  private shell(title: string): HTMLElement {
    const view = document.createElement('main');
    view.className = 'game-menu';
    view.innerHTML = `<p class="game-menu__eyebrow">CONTROL SHIFT</p><h1>${title}</h1>`;
    this.root.append(view);
    return view;
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
    this.root.append(createChapterScene());
  };

  showStages(group: number): void {
    this.clear();
    const view = this.shell(`${stageGroups[group]} · 스테이지 선택`);
    const list = document.createElement('div');
    list.className = 'stage-grid';
    for (let index = 0; index < stagesPerGroup; index += 1) {
      list.append(this.button(`스테이지 ${index + 1}`, () => void this.play({ group, index })));
    }
    view.append(list, this.button('뒤로', this.showGroups));
  }

  private async play(stage: Stage): Promise<void> {
    this.clear();
    this.selectedStage = stage;
    const loading = this.shell(`스테이지 ${stage.index + 1}`);
    loading.append(document.createTextNode('맵을 불러오는 중…'));

    try {
      const response = await fetch(new URL('@/maps/001.map', import.meta.url));
      if (!response.ok) throw new Error('맵을 불러올 수 없습니다.');
      const result = parseMap(await response.text());
      if (!result.ok) throw new Error('맵을 불러올 수 없습니다.');
      this.startGame(createGameStoreFromMap(result.map));
    } catch (error) {
      const message = document.createElement('p');
      message.textContent = error instanceof Error ? error.message : '맵을 불러올 수 없습니다.';
      loading.append(message);
      loading.append(this.button('스테이지 선택', () => this.showStages(stage.group)));
    }
  }

  private startGame(store: GameStoreApi): void {
    this.clear();
    const play = document.createElement('main');
    play.className = 'game-play';
    play.innerHTML = `<p class="game-play__label">${stageGroups[this.selectedStage.group]} · ${this.selectedStage.index + 1}</p><nav class="game-nav"></nav><div class="game-canvas" data-game-canvas></div>`;
    play.querySelector<HTMLElement>('.game-nav')!.append(this.button('홈으로', this.showGameStart));
    this.root.append(play);
    this.game = createPhaserGame(play.querySelector<HTMLElement>('[data-game-canvas]')!, store);
    this.unsubscribe = store.subscribe((state, previous) => {
      if (state.game.status === 'completed' && previous.game.status !== 'completed') this.showComplete();
    });
  }

  private showComplete(): void {
    this.clear();
    const view = this.shell('스테이지 클리어!');
    const burst = document.createElement('div');
    burst.className = 'celebration';
    for (let index = 0; index < 18; index += 1) {
      const spark = document.createElement('i');
      spark.style.setProperty('--angle', `${index * 20}deg`);
      spark.style.setProperty('--delay', `${(index % 3) * 70}ms`);
      burst.append(spark);
    }
    const actions = document.createElement('div');
    actions.className = 'stage-grid';
    actions.append(
      this.button('다음 단계', () => void this.play(nextStage(this.selectedStage))),
      this.button('다시해보기', () => void this.play(this.selectedStage)),
      this.button('홈으로', this.showGameStart),
    );
    view.append(burst, actions);
  }
}
