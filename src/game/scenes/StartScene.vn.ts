import { createPlateButton } from '../components/PlateButton';

const assets = {
  background: new URL('@/assets/background/background_space.png', import.meta.url).href,
  lunar: new URL('@/assets/lunar/Lunar.png', import.meta.url).href,
  starConcave: new URL('@/assets/star/star_concave.png', import.meta.url).href,
  starConvex: new URL('@/assets/star/star_convex.png', import.meta.url).href,
  starCrossSmall: new URL('@/assets/star/star_cross_s.png', import.meta.url).href,
  starCrossMedium: new URL('@/assets/star/star_cross_m.png', import.meta.url).href,
  starCrossLarge: new URL('@/assets/star/star_cross_l.png', import.meta.url).href,
};

const starPositions = [['8%', '14%'], ['33%', '-16%'], ['66%', '5%'], ['91%', '28%'], ['4%', '74%'], ['29%', '110%'], ['70%', '105%'], ['95%', '75%']] as const;
const backgroundStarGroups = [
  { source: assets.starCrossSmall, count: 11, size: 'small' },
  { source: assets.starCrossMedium, count: 7, size: 'medium' },
  { source: assets.starCrossLarge, count: 5, size: 'large' },
] as const;

export function createStartScene(onComplete: () => void): { view: HTMLElement; dispose: () => void } {
  const scene = new StartScene(onComplete);
  return { view: scene.render(), dispose: scene.dispose };
}

class StartScene {
  private readonly view = this.renderView();

  constructor(private readonly onComplete: () => void) {}

  render(): HTMLElement {
    this.view.append(this.renderBackgroundStars(), this.renderLunar(), this.renderStartArea());
    return this.view;
  }

  dispose = (): void => {};

  private renderView(): HTMLElement {
    const view = document.createElement('main');
    view.className = 'game-menu game-intro';
    view.style.backgroundImage = `url(${assets.background})`;
    return view;
  }

  private renderLunar(): HTMLImageElement {
    const lunar = document.createElement('img');
    lunar.className = 'game-intro__lunar';
    lunar.src = assets.lunar;
    lunar.alt = '';
    return lunar;
  }

  private renderBackgroundStars(): HTMLElement {
    const stars = document.createElement('div');
    stars.className = 'game-intro__background-stars';
    stars.setAttribute('aria-hidden', 'true');
    backgroundStarGroups.forEach(({ source, count, size }) => {
      for (let index = 0; index < count; index += 1) stars.append(this.renderBackgroundStar(source, size));
    });
    return stars;
  }

  private renderBackgroundStar(source: string, size: 'small' | 'medium' | 'large'): HTMLImageElement {
    const star = document.createElement('img');
    star.className = `game-intro__background-star game-intro__background-star--${size}`;
    star.src = source;
    star.alt = '';
    star.style.setProperty('--x', `${this.randomPercent()}%`);
    star.style.setProperty('--y', `${this.randomPercent()}%`);
    return star;
  }

  private randomPercent(): number {
    return 4 + Math.random() * 92;
  }

  private renderStartArea(): HTMLElement {
    const area = document.createElement('div');
    area.className = 'game-intro__start-area';
    area.append(this.renderStars(), this.renderStartButton());
    return area;
  }

  private renderStars(): HTMLElement {
    const stars = document.createElement('div');
    stars.className = 'game-intro__stars';
    stars.setAttribute('aria-hidden', 'true');
    starPositions.forEach((position, index) => stars.append(this.renderStar(position, index)));
    return stars;
  }

  private renderStar(position: readonly [string, string], index: number): HTMLImageElement {
    const star = document.createElement('img');
    star.src = index % 2 ? assets.starConvex : assets.starConcave;
    this.positionStar(star, position);
    return star;
  }

  private positionStar(star: HTMLImageElement, [x, y]: readonly [string, string]): void {
    star.style.setProperty('--x', x);
    star.style.setProperty('--y', y);
  }

  private renderStartButton(): HTMLButtonElement {
    const start = createPlateButton('START', this.onComplete);
    start.classList.add('game-intro__start');
    return start;
  }
}
