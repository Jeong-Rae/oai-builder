const assets = {
  background: new URL('@/assets/background/background_space.png', import.meta.url).href,
  starCrossSmall: new URL('@/assets/star/star_cross_s.png', import.meta.url).href,
  starCrossMedium: new URL('@/assets/star/star_cross_m.png', import.meta.url).href,
  starCrossLarge: new URL('@/assets/star/star_cross_l.png', import.meta.url).href,
  starPlusGold: new URL('@/assets/star/star_plus_gold_s.png', import.meta.url).href,
};

const starGroups = [
  { source: assets.starCrossSmall, count: 14, size: 'small' },
  { source: assets.starCrossMedium, count: 6, size: 'medium' },
  { source: assets.starCrossLarge, count: 4, size: 'large' },
] as const;

export function createChapterScene(): HTMLElement {
  const view = document.createElement('main');
  view.className = 'game-menu game-intro game-chapter';
  view.style.backgroundImage = `url(${assets.background})`;
  const title = document.createElement('h1');
  title.className = 'game-chapter__title';
  title.append(renderTitleStar(), document.createTextNode('CHAPTER SELECT'), renderTitleStar());
  view.append(renderBackgroundStars(), title);
  return view;
}

function renderTitleStar(): HTMLImageElement {
  const star = document.createElement('img');
  star.className = 'game-chapter__title-star';
  star.src = assets.starPlusGold;
  star.alt = '';
  return star;
}

function renderBackgroundStars(): HTMLElement {
  const stars = document.createElement('div');
  stars.className = 'game-intro__background-stars';
  stars.setAttribute('aria-hidden', 'true');
  starGroups.forEach(({ source, count, size }) => {
    for (let index = 0; index < count; index += 1) stars.append(renderBackgroundStar(source, size));
  });
  return stars;
}

function renderBackgroundStar(source: string, size: 'small' | 'medium' | 'large'): HTMLImageElement {
  const star = document.createElement('img');
  star.className = `game-intro__background-star game-intro__background-star--${size}`;
  star.src = source;
  star.alt = '';
  star.style.setProperty('--x', `${4 + Math.random() * 92}%`);
  star.style.setProperty('--y', `${4 + Math.random() * 92}%`);
  return star;
}
