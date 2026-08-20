const assets = {
  background: new URL('@/assets/background/background_space.png', import.meta.url).href,
  starCrossSmall: new URL('@/assets/star/star_cross_s.png', import.meta.url).href,
  starCrossMedium: new URL('@/assets/star/star_cross_m.png', import.meta.url).href,
  starCrossLarge: new URL('@/assets/star/star_cross_l.png', import.meta.url).href,
  starPlusGold: new URL('@/assets/star/star_plus_gold_s.png', import.meta.url).href,
  starConstellation: new URL('@/assets/star/star_stell_gold_m.png', import.meta.url).href,
  zodiacAries: new URL('@/assets/zodiac/zodiac_aries_active.png', import.meta.url).href,
  arrowLeft: new URL('@/assets/arrow/arrow_left.svg', import.meta.url).href,
  arrowRight: new URL('@/assets/arrow/arrow_right.svg', import.meta.url).href,
};

const starGroups = [
  { source: assets.starCrossSmall, count: 14, size: 'small' },
  { source: assets.starCrossMedium, count: 6, size: 'medium' },
  { source: assets.starCrossLarge, count: 4, size: 'large' },
] as const;

interface ChapterSet {
  sign: 'ARIES';
}

type CarouselPosition = 'previous' | 'current' | 'next' | 'enter-previous' | 'enter-next' | 'exit-previous' | 'exit-next';

const chapterSets: readonly ChapterSet[] = Array.from({ length: 12 }, () => ({ sign: 'ARIES' }));

export function createChapterScene(): HTMLElement {
  const view = document.createElement('main');
  view.className = 'game-menu game-intro game-chapter';
  view.style.backgroundImage = `url(${assets.background})`;
  const title = document.createElement('h1');
  title.className = 'game-chapter__title';
  title.append(renderTitleStar(), document.createTextNode('CHAPTER SELECT'), renderTitleStar());
  const carousel = createCarousel();
  view.append(
    title,
    carousel.view,
    renderCarouselArrow('previous', assets.arrowLeft, () => carousel.move(-1)),
    renderCarouselArrow('next', assets.arrowRight, () => carousel.move(1)),
    renderBackgroundStars(),
  );
  return view;
}

function createCarousel(): { view: HTMLElement; move: (offset: number) => void } {
  const carousel = document.createElement('div');
  carousel.className = 'game-chapter__carousel';
  carousel.setAttribute('aria-hidden', 'true');
  let activeIndex = 0;
  let moving = false;
  carousel.replaceChildren(
    renderCarouselCard(activeIndex - 1, 'previous'),
    renderCarouselCard(activeIndex, 'current'),
    renderCarouselCard(activeIndex + 1, 'next'),
  );
  return {
    view: carousel,
    move: (offset) => {
      if (moving) return;
      moving = true;
      const forwards = offset > 0;
      const previous = carousel.querySelector<HTMLElement>('.game-chapter__card--previous')!;
      const current = carousel.querySelector<HTMLElement>('.game-chapter__card--current')!;
      const next = carousel.querySelector<HTMLElement>('.game-chapter__card--next')!;
      const incoming = renderCarouselCard(activeIndex + (forwards ? 2 : -2), forwards ? 'enter-next' : 'enter-previous');
      carousel.append(incoming);
      void incoming.offsetWidth;

      setCarouselPosition(forwards ? previous : next, forwards ? 'exit-previous' : 'exit-next');
      setCarouselPosition(current, forwards ? 'previous' : 'next');
      setCarouselPosition(forwards ? next : previous, 'current');
      setCarouselPosition(incoming, forwards ? 'next' : 'previous');
      activeIndex = (activeIndex + offset + chapterSets.length) % chapterSets.length;
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420;
      window.setTimeout(() => {
        (forwards ? previous : next).remove();
        moving = false;
      }, duration);
    },
  };
}

function renderCarouselCard(chapterIndex: number, position: CarouselPosition): HTMLElement {
  const card = document.createElement('div');
  setCarouselPosition(card, position);
  const wrappedIndex = (chapterIndex + chapterSets.length) % chapterSets.length;
  card.append(renderChapterSet(chapterSets[wrappedIndex]!));
  return card;
}

function setCarouselPosition(card: HTMLElement, position: CarouselPosition): void {
  card.className = `game-chapter__card game-chapter__card--${position}`;
}

function renderCarouselArrow(position: 'previous' | 'next', source: string, onClick: () => void): HTMLButtonElement {
  const arrow = document.createElement('button');
  arrow.type = 'button';
  arrow.className = `game-chapter__arrow game-chapter__arrow--${position}`;
  arrow.setAttribute('aria-label', position === 'previous' ? '이전 챕터' : '다음 챕터');
  arrow.addEventListener('click', onClick);
  const image = document.createElement('img');
  image.src = source;
  image.alt = '';
  arrow.append(image);
  return arrow;
}

function renderChapterSet(chapter: ChapterSet): SVGSVGElement {
  return renderAriesConstellation(chapter.sign);
}

function renderAriesConstellation(sign: 'ARIES'): SVGSVGElement {
  const constellation = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  constellation.classList.add('game-chapter__constellation');
  constellation.setAttribute('viewBox', '0 0 450 600');
  constellation.setAttribute('role', 'img');
  constellation.setAttribute('aria-label', `${sign} 별자리`);
  constellation.innerHTML = `
    <g transform="translate(0 -100)">
      <path class="game-chapter__constellation-line" d="M78 365 L205 325 L315 230 L370 260" />
      <image class="game-chapter__constellation-star" href="${assets.starConstellation}" x="52" y="339" width="52" height="52" />
      <image class="game-chapter__constellation-star" href="${assets.starConstellation}" x="179" y="299" width="52" height="52" />
      <image class="game-chapter__constellation-star" href="${assets.starConstellation}" x="289" y="204" width="52" height="52" />
      <image class="game-chapter__constellation-star" href="${assets.starConstellation}" x="344" y="234" width="52" height="52" />
    </g>
    <image class="game-chapter__zodiac" href="${assets.zodiacAries}" x="177" y="420" width="96" height="80" />
    <text class="game-chapter__zodiac-name" x="225" y="545">${sign}</text>
  `;
  return constellation;
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
