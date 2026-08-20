import Phaser from 'phaser';

import { chapters, type ChapterDefinition } from '../stages';

const WIDTH = 1920;
const HEIGHT = 1080;
const CARD_Y = 540;
const CARD_OFFSET = 425.75;
const EXIT_OFFSET = 760;
const GOLD = 0xffd866;
const MOVE_DURATION = 420;
const BACKGROUND_STARS_DEPTH = -2;
const SIGN_SIDE_DEPTH = 1;
const SIGN_CURRENT_DEPTH = 2;
const CHAPTER_DEPTH = 3;

const assets = {
  background: new URL('@/assets/background/background_space.png', import.meta.url).href,
  font: new URL('@/assets/fonts/blrrpixs016.ttf', import.meta.url).href,
  starCrossSmall: new URL('@/assets/star/star_cross_s.png', import.meta.url).href,
  starCrossMedium: new URL('@/assets/star/star_cross_m.png', import.meta.url).href,
  starCrossLarge: new URL('@/assets/star/star_cross_l.png', import.meta.url).href,
  titleStar: new URL('@/assets/star/star_plus_gold_s.png', import.meta.url).href,
  constellationStar: new URL('@/assets/star/star_stell_gold_m.png', import.meta.url).href,
  arrowLeft: new URL('@/assets/arrow/arrow_left.svg', import.meta.url).href,
  arrowRight: new URL('@/assets/arrow/arrow_right.svg', import.meta.url).href,
};

interface CarouselCard {
  index: number;
  valid: boolean;
  view: Phaser.GameObjects.Container;
}

export class ChapterScene extends Phaser.Scene {
  private activeIndex = 0;
  private cards: CarouselCard[] = [];
  private moving = false;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    super('chapter');
  }

  preload(): void {
    this.load.image('chapter-background', assets.background);
    this.load.image('chapter-star-small', assets.starCrossSmall);
    this.load.image('chapter-star-medium', assets.starCrossMedium);
    this.load.image('chapter-star-large', assets.starCrossLarge);
    this.load.image('chapter-title-star', assets.titleStar);
    this.load.image('chapter-constellation-star', assets.constellationStar);
    this.load.image('chapter-arrow-left', assets.arrowLeft);
    this.load.image('chapter-arrow-right', assets.arrowRight);
    this.load.font('Blrr Pixs', assets.font, 'truetype');
    this.load.image('chapter-zodiac-aries', chapters[0]!.zodiacUrl);
  }

  create(): void {
    this.renderBackground();
    this.renderBackgroundStars();
    this.renderTitle();
    this.cards = [
      this.createCard(this.activeIndex - 1, WIDTH / 2 - CARD_OFFSET, 0.75, 0.8),
      this.createCard(this.activeIndex, WIDTH / 2, 1, 1),
      this.createCard(this.activeIndex + 1, WIDTH / 2 + CARD_OFFSET, 0.75, 0.8),
    ];
    this.renderArrow('chapter-arrow-left', 64, () => this.move(-1));
    this.renderArrow('chapter-arrow-right', WIDTH - 64, () => this.move(1));

    this.input.keyboard?.on('keydown-LEFT', this.movePrevious, this);
    this.input.keyboard?.on('keydown-RIGHT', this.moveNext, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.cameras.main.fadeIn(this.reducedMotion ? 0 : 180, 8, 14, 20);
  }

  private renderBackground(): void {
    const background = this.add.image(WIDTH / 2, HEIGHT / 2, 'chapter-background');
    const source = background.texture.getSourceImage() as HTMLImageElement;
    const scale = Math.max(WIDTH / source.width, HEIGHT / source.height);
    background.setScale(scale).setDepth(-3);
  }

  private renderBackgroundStars(): void {
    const random = new Phaser.Math.RandomDataGenerator(['chapter-stars']);
    const groups = [
      { key: 'chapter-star-small', count: 14, width: 9.6 },
      { key: 'chapter-star-medium', count: 6, width: 11.2 },
      { key: 'chapter-star-large', count: 4, width: 12.8 },
    ];

    groups.forEach(({ key, count, width }) => {
      for (let index = 0; index < count; index += 1) {
        const star = this.add
          .image(random.between(77, WIDTH - 77), random.between(43, HEIGHT - 43), key)
          .setDisplaySize(width, width)
          .setAlpha(random.realInRange(0.58, 0.9))
          .setDepth(BACKGROUND_STARS_DEPTH);

        if (!this.reducedMotion) {
          this.tweens.add({
            targets: star,
            alpha: random.realInRange(0.82, 1),
            scaleX: star.scaleX * 1.08,
            scaleY: star.scaleY * 1.08,
            duration: random.between(1600, 3200),
            delay: random.between(0, 1200),
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
          });
        }
      }
    });
  }

  private renderTitle(): void {
    const title = this.add.text(WIDTH / 2, 80, 'CHAPTER SELECT', {
      color: '#ffffff',
      fontFamily: 'Blrr Pixs',
      fontSize: '72px',
      letterSpacing: 6,
    }).setOrigin(0.5, 0).setDepth(CHAPTER_DEPTH);
    const starGap = 40;
    const starSize = 36;
    this.add.image(title.getLeftCenter().x - starGap - starSize / 2, title.getCenter().y, 'chapter-title-star')
      .setDisplaySize(starSize, starSize)
      .setDepth(CHAPTER_DEPTH);
    this.add.image(title.getRightCenter().x + starGap + starSize / 2, title.getCenter().y, 'chapter-title-star')
      .setDisplaySize(starSize, starSize)
      .setDepth(CHAPTER_DEPTH);
  }

  private renderArrow(texture: string, x: number, onPress: () => void): void {
    const arrow = this.add.image(x, HEIGHT / 2, texture)
      .setDisplaySize(80, 80)
      .setInteractive({ useHandCursor: true });
    arrow.on('pointerdown', onPress);
    arrow.on('pointerover', () => arrow.setTint(0xffffff).setDisplaySize(86, 86));
    arrow.on('pointerout', () => arrow.clearTint().setDisplaySize(80, 80));
  }

  private createCard(index: number, x: number, scale: number, alpha: number): CarouselCard {
    const isOutside = index < 0 || index >= chapters.length;
    const chapterIndex = Phaser.Math.Clamp(index, 0, chapters.length - 1);
    const view = this.renderChapter(chapters[chapterIndex]!)
      .setPosition(x, CARD_Y)
      .setScale(scale)
      .setAlpha(isOutside ? 0 : alpha)
      .setDepth(scale === 1 ? SIGN_CURRENT_DEPTH : SIGN_SIDE_DEPTH);
    return { index: chapterIndex, valid: !isOutside, view };
  }

  private renderChapter(chapter: ChapterDefinition): Phaser.GameObjects.Container {
    const view = this.add.container(0, 0);
    const points = chapter.constellation.map(({ x, y }) => new Phaser.Math.Vector2(x - 225, y - 300));
    const halo = this.add.graphics().lineStyle(9, GOLD, 0.12);
    const line = this.add.graphics().lineStyle(3, GOLD, 1);
    this.drawDashedLine(halo, points, 5, 7);
    this.drawDashedLine(line, points, 5, 7);
    line.filters?.external.addGlow(GOLD, 1.5, 0, 1, false, 6, 8).setPaddingOverride(null);
    view.add([halo, line]);

    points.forEach(({ x, y }) => {
      const glow = this.add.image(x, y, 'chapter-constellation-star')
        .setDisplaySize(60, 60)
        .setAlpha(0.18)
        .setBlendMode(Phaser.BlendModes.ADD);
      const star = this.add.image(x, y, 'chapter-constellation-star').setDisplaySize(52, 52);
      star.filters?.external.addGlow(GOLD, 1.2, 0, 1, false, 6, 8).setPaddingOverride(null);
      view.add([glow, star]);
    });

    const zodiac = this.add.image(0, 160, 'chapter-zodiac-aries').setDisplaySize(96, 80);
    const name = this.add.text(0, 210, chapter.sign, {
      color: '#ffd866',
      fontFamily: 'Blrr Pixs',
      fontSize: '36px',
      fontStyle: 'bold',
      letterSpacing: 5,
    }).setOrigin(0.5, 0);
    view.add([zodiac, name]);
    return view;
  }

  private drawDashedLine(
    graphics: Phaser.GameObjects.Graphics,
    points: readonly Phaser.Math.Vector2[],
    dash: number,
    gap: number,
  ): void {
    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1]!;
      const to = points[index]!;
      const distance = Phaser.Math.Distance.BetweenPoints(from, to);
      const direction = new Phaser.Math.Vector2(to.x - from.x, to.y - from.y).normalize();

      for (let offset = 0; offset < distance; offset += dash + gap) {
        const end = Math.min(offset + dash, distance);
        graphics.beginPath();
        graphics.moveTo(from.x + direction.x * offset, from.y + direction.y * offset);
        graphics.lineTo(from.x + direction.x * end, from.y + direction.y * end);
        graphics.strokePath();
      }
    }
  }

  private movePrevious(): void {
    this.move(-1);
  }

  private moveNext(): void {
    this.move(1);
  }

  private move(offset: -1 | 1): void {
    if (this.moving) return;
    const nextIndex = this.activeIndex + offset;
    if (nextIndex < 0 || nextIndex >= chapters.length) return;

    this.moving = true;
    const forwards = offset > 0;
    const [previous, current, next] = this.cards;
    const incoming = this.createCard(
      this.activeIndex + (forwards ? 2 : -2),
      WIDTH / 2 + (forwards ? EXIT_OFFSET : -EXIT_OFFSET),
      0.55,
      0,
    );
    const outgoing = forwards ? previous! : next!;
    const targets = forwards
      ? [
          [previous!, WIDTH / 2 - EXIT_OFFSET, 0.55, 0],
          [current!, WIDTH / 2 - CARD_OFFSET, 0.75, 0.8],
          [next!, WIDTH / 2, 1, 1],
          [incoming, WIDTH / 2 + CARD_OFFSET, 0.75, incoming.valid ? 0.8 : 0],
        ] as const
      : [
          [next!, WIDTH / 2 + EXIT_OFFSET, 0.55, 0],
          [current!, WIDTH / 2 + CARD_OFFSET, 0.75, 0.8],
          [previous!, WIDTH / 2, 1, 1],
          [incoming, WIDTH / 2 - CARD_OFFSET, 0.75, incoming.valid ? 0.8 : 0],
        ] as const;

    const finish = () => {
      outgoing.view.destroy(true);
      this.cards = forwards ? [current!, next!, incoming] : [incoming, previous!, current!];
      this.activeIndex = nextIndex;
      this.moving = false;
    };

    targets.forEach(([card, , scale]) => card.view.setDepth(scale === 1 ? SIGN_CURRENT_DEPTH : scale === 0.55 ? 0 : SIGN_SIDE_DEPTH));

    if (this.reducedMotion) {
      targets.forEach(([card, x, scale, alpha]) => card.view.setPosition(x, CARD_Y).setScale(scale).setAlpha(alpha));
      finish();
      return;
    }

    targets.forEach(([card, x, scale, alpha], index) => {
      this.tweens.add({
        targets: card.view,
        x,
        scaleX: scale,
        scaleY: scale,
        alpha,
        duration: MOVE_DURATION,
        ease: 'Cubic.easeOut',
        onComplete: index === targets.length - 1 ? finish : undefined,
      });
    });
  }

  private shutdown(): void {
    this.input.keyboard?.off('keydown-LEFT', this.movePrevious, this);
    this.input.keyboard?.off('keydown-RIGHT', this.moveNext, this);
    this.cards = [];
    this.moving = false;
  }
}
