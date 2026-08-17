import type Phaser from 'phaser';

import { parseMap } from '../map/mapDocument';
import { createPhaserGame } from './createGame';
import { createGameStoreFromMap, type GameStoreApi } from './store/gameStore';
import { nextStage, stageGroups, stagesPerGroup, type Stage } from './stages';

const introAssets = {
  background: new URL('../../assets/intro_background_image.png', import.meta.url).href,
  title: new URL('../../assets/intro_title_image.png', import.meta.url).href,
  character: new URL('../../assets/playable/player_default.png', import.meta.url).href,
  characterDown: new URL('../../assets/playable/player_down.png', import.meta.url).href,
  characterRight: new URL('../../assets/playable/player_right.png', import.meta.url).href,
  characterUp: new URL('../../assets/playable/player_up.png', import.meta.url).href,
  characterLeft: new URL('../../assets/playable/player_left.png', import.meta.url).href,
  start: new URL('../../assets/intro_startbutton_image.png', import.meta.url).href,
  starConcave: new URL('../../assets/star/star_concave.png', import.meta.url).href,
  starConvex: new URL('../../assets/star/star_convex.png', import.meta.url).href,
};

export class GameApp {
  private game?: Phaser.Game;
  private stopIntroSpin?: () => void;
  private unsubscribe?: () => void;
  private selectedStage: Stage = { group: 0, index: 0 };

  constructor(private readonly root: HTMLElement) {
    this.showHome();
  }

  private clear(): void {
    this.stopIntroSpin?.();
    this.stopIntroSpin = undefined;
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

  showHome = (): void => {
    this.clear();
    const view = document.createElement('main');
    view.className = 'game-menu game-intro';
    view.style.backgroundImage = `url(${introAssets.background})`;

    const title = document.createElement('img');
    title.className = 'game-intro__title';
    title.src = introAssets.title;
    title.alt = 'Cat Save the Universe';

    const characterSources = [
      introAssets.character,
      introAssets.characterDown,
      introAssets.characterRight,
      introAssets.characterUp,
      introAssets.characterLeft,
    ];
    const characters = characterSources.map((source, index) => {
      const character = document.createElement('img');
      character.className = `game-intro__character${index === 0 ? ' game-intro__character--active' : ''}`;
      character.src = source;
      character.alt = index === 0 ? '우주복을 입은 고양이' : '';
      return character;
    });

    const startArea = document.createElement('div');
    startArea.className = 'game-intro__start-area';
    const glow = document.createElement('div');
    glow.className = 'game-intro__start-glow';
    glow.setAttribute('aria-hidden', 'true');
    const stars = document.createElement('div');
    stars.className = 'game-intro__stars';
    stars.setAttribute('aria-hidden', 'true');
    const starElements: HTMLImageElement[] = [];
    const starPositions = [
      ['8%', '14%'], ['33%', '-16%'], ['66%', '5%'], ['91%', '28%'],
      ['4%', '74%'], ['29%', '110%'], ['70%', '105%'], ['95%', '75%'],
    ];
    starPositions.forEach(([x, y], index) => {
      const star = document.createElement('img');
      star.src = index % 2 ? introAssets.starConvex : introAssets.starConcave;
      star.style.setProperty('--x', x);
      star.style.setProperty('--y', y);
      starElements.push(star);
      stars.append(star);
    });
    const start = this.button('', this.showGroups);
    start.className = 'game-intro__start';
    start.style.backgroundImage = `url(${introAssets.start})`;
    start.setAttribute('aria-label', '시작하기');
    let frame = 0;
    let spinTimer: number | undefined;
    const starTimers = new Set<number>();
    const showCharacter = (index: number) => {
      characters.forEach((character, current) => character.classList.toggle('game-intro__character--active', current === index));
    };
    const stopSpin = () => {
      if (spinTimer !== undefined) window.clearInterval(spinTimer);
      starTimers.forEach((timer) => window.clearTimeout(timer));
      starTimers.clear();
      spinTimer = undefined;
      frame = 0;
      starElements.forEach((star) => star.classList.remove('game-intro__star--lit'));
      showCharacter(0);
    };
    const startSpin = () => {
      if (spinTimer !== undefined || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const jitter = (base: number, range: number) => base + Math.random() * range;
      const litCount = () => starElements.filter((star) => star.classList.contains('game-intro__star--lit')).length;
      function scheduleStar(star: HTMLImageElement, delay: number): void {
        const timer = window.setTimeout(() => {
          starTimers.delete(timer);
          twinkle(star);
        }, delay);
        starTimers.add(timer);
      }
      function twinkle(star: HTMLImageElement): void {
        const lit = star.classList.contains('game-intro__star--lit');
        if ((lit && litCount() <= 2) || (!lit && litCount() >= 4)) {
          scheduleStar(star, jitter(180, 240));
          return;
        }
        star.classList.toggle('game-intro__star--lit');
        scheduleStar(star, lit ? jitter(950, 650) : jitter(800, 600));
      }
      const firstLit = Math.floor(Math.random() * starElements.length);
      const secondLit = (firstLit + 1 + Math.floor(Math.random() * (starElements.length - 1))) % starElements.length;
      starElements.forEach((star, index) => {
        if (index === firstLit || index === secondLit) star.classList.add('game-intro__star--lit');
        scheduleStar(star, index === firstLit || index === secondLit ? jitter(800, 600) : jitter(160, 740));
      });
      showCharacter((frame++ % 4) + 1);
      spinTimer = window.setInterval(() => {
        showCharacter((frame++ % 4) + 1);
      }, 140);
    };
    start.addEventListener('pointerenter', startSpin);
    start.addEventListener('pointerleave', stopSpin);
    start.addEventListener('focus', startSpin);
    start.addEventListener('blur', stopSpin);
    this.stopIntroSpin = stopSpin;
    startArea.append(glow, stars, start);
    view.append(title, ...characters, startArea);
    this.root.append(view);
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
      const response = await fetch(new URL('../../maps/001.map', import.meta.url));
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
    play.querySelector<HTMLElement>('.game-nav')!.append(this.button('홈으로', this.showHome));
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
      this.button('홈으로', this.showHome),
    );
    view.append(burst, actions);
  }
}
