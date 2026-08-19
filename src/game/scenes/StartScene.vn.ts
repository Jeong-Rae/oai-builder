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
  private readonly starElements: HTMLImageElement[] = [];
  private readonly starTimers = new Set<number>();
  private spinning = false;

  constructor(private readonly onComplete: () => void) {}

  render(): HTMLElement {
    this.view.append(this.renderBackgroundStars(), this.renderLunar(), this.renderStartArea());
    return this.view;
  }

  dispose = (): void => this.stopSpin();

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
    this.positionBackgroundStar(star);
    return star;
  }

  private positionBackgroundStar(star: HTMLImageElement): void {
    star.style.setProperty('--x', `${this.randomPercent()}%`);
    star.style.setProperty('--y', `${this.randomPercent()}%`);
  }

  private randomPercent(): number {
    return 4 + Math.random() * 92;
  }

  private renderStartArea(): HTMLElement {
    const area = document.createElement('div');
    area.className = 'game-intro__start-area';
    const glow = document.createElement('div');
    glow.className = 'game-intro__start-glow';
    glow.setAttribute('aria-hidden', 'true');
    area.append(glow, this.renderStars(), this.renderStartButton());
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
    this.starElements.push(star);
    return star;
  }

  private positionStar(star: HTMLImageElement, [x, y]: readonly [string, string]): void {
    star.style.setProperty('--x', x);
    star.style.setProperty('--y', y);
  }

  private renderStartButton(): HTMLButtonElement {
    const start = createPlateButton('START', this.onComplete);
    start.classList.add('game-intro__start');
    start.addEventListener('pointerenter', this.startSpin);
    start.addEventListener('pointerleave', this.stopSpin);
    start.addEventListener('focus', this.startSpin);
    start.addEventListener('blur', this.stopSpin);
    return start;
  }

  private readonly stopSpin = (): void => {
    this.starTimers.forEach((timer) => window.clearTimeout(timer));
    this.starTimers.clear();
    this.spinning = false;
    this.starElements.forEach((star) => star.classList.remove('game-intro__star--lit'));
  };

  private readonly startSpin = (): void => {
    if (this.spinning || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.spinning = true;
    const initialLitStars = this.initialLitStars();
    this.starElements.forEach((star, index) => {
      const startsLit = initialLitStars.has(index);
      if (startsLit) star.classList.add('game-intro__star--lit');
      this.scheduleStar(star, startsLit ? this.jitter(800, 600) : this.jitter(160, 740));
    });
  };

  private initialLitStars(): Set<number> {
    const first = Math.floor(Math.random() * this.starElements.length);
    const second = (first + 1 + Math.floor(Math.random() * (this.starElements.length - 1))) % this.starElements.length;
    return new Set([first, second]);
  }

  private scheduleStar(star: HTMLImageElement, delay: number): void {
    const timer = window.setTimeout(() => {
      this.starTimers.delete(timer);
      this.twinkleStar(star);
    }, delay);
    this.starTimers.add(timer);
  }

  private twinkleStar(star: HTMLImageElement): void {
    const lit = star.classList.contains('game-intro__star--lit');
    if (this.reachedLitStarLimit(lit)) return this.scheduleStar(star, this.jitter(180, 240));
    star.classList.toggle('game-intro__star--lit');
    this.scheduleStar(star, lit ? this.jitter(950, 650) : this.jitter(800, 600));
  }

  private reachedLitStarLimit(isLit: boolean): boolean {
    const litCount = this.starElements.filter((star) => star.classList.contains('game-intro__star--lit')).length;
    return (isLit && litCount <= 2) || (!isLit && litCount >= 4);
  }

  private jitter(base: number, range: number): number {
    return base + Math.random() * range;
  }
}
