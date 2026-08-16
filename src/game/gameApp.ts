import type Phaser from 'phaser';

import mapText from '../../maps/001.map?raw';
import { parseMap } from '../map/mapDocument';
import { createPhaserGame } from './createGame';
import { createGameStoreFromMap, type GameStoreApi } from './store/gameStore';
import { stageGroups, stagesPerGroup, type Stage } from './stages';

export class GameApp {
  private game?: Phaser.Game;
  private selectedStage: Stage = { group: 0, index: 0 };

  constructor(private readonly root: HTMLElement) {
    this.showHome();
  }

  private clear(): void {
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

  showHome = (): void => {
    this.clear();
    const view = this.shell('손끝으로 길을 바꿔라');
    view.append(this.button('시작하기', this.showGroups));
  };

  showGroups = (): void => {
    this.clear();
    const view = this.shell('난이도를 고르세요');
    const list = document.createElement('div');
    list.className = 'stage-grid';
    stageGroups.forEach((group, index) => list.append(this.button(group, () => this.showStages(index))));
    view.append(list);
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
      const result = parseMap(mapText);
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
    play.innerHTML = `<p class="game-play__label">${stageGroups[this.selectedStage.group]} · ${this.selectedStage.index + 1}</p><div class="game-canvas" data-game-canvas></div>`;
    this.root.append(play);
    this.game = createPhaserGame(play.querySelector<HTMLElement>('[data-game-canvas]')!, store);
  }
}
