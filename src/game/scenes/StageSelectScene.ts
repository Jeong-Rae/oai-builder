import Phaser from "phaser";

import { chapters, type ChapterDefinition } from "../stages";

const WIDTH = 1920;
const HEIGHT = 1080;
const GOLD = 0xffd866;
const BACKGROUND_STARS_DEPTH = -2;
const TITLE_DEPTH = 3;

const backgroundStarGroups = [
  {
    key: "stage-select-star-small",
    width: 9.6,
    height: 9.25,
    positions: [
      [41.7, 12.5],
      [42.3, 30.1],
      [61.7, 51.6],
      [45.3, 5.1],
      [5.5, 38.4],
      [90.7, 62.9],
      [34.3, 5.8],
      [44.6, 45.5],
      [83.5, 73.1],
      [58.9, 70.7],
      [19.7, 83.0],
      [77.9, 76.3],
      [93.9, 47.7],
      [72.1, 35.1],
    ],
  },
  {
    key: "stage-select-star-medium",
    width: 11.2,
    height: 12.02,
    positions: [
      [6.3, 62.0],
      [83.6, 24.2],
      [23.7, 7.0],
      [41.3, 30.2],
      [67.1, 36.0],
      [24.7, 37.1],
    ],
  },
  {
    key: "stage-select-star-large",
    width: 12.8,
    height: 13.64,
    positions: [
      [5.3, 47.6],
      [64.5, 95.6],
      [55.2, 82.8],
      [84.1, 92.5],
    ],
  },
] as const;

const assets = {
  background: new URL("@/assets/background/background_space.png", import.meta.url).href,
  font: new URL("@/assets/fonts/blrrpixs016.ttf", import.meta.url).href,
  starCrossSmall: new URL("@/assets/star/star_cross_s.png", import.meta.url).href,
  starCrossMedium: new URL("@/assets/star/star_cross_m.png", import.meta.url).href,
  starCrossLarge: new URL("@/assets/star/star_cross_l.png", import.meta.url).href,
  titleStar: new URL("@/assets/star/star_plus_gold_s.png", import.meta.url).href,
  constellationStar: new URL("@/assets/star/star_stell_gold_m.png", import.meta.url).href,
};

export class StageSelectScene extends Phaser.Scene {
  private chapterIndex = 0;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor() {
    super("stage-select");
  }

  init(data: { chapterIndex?: number } = {}): void {
    this.chapterIndex = data.chapterIndex ?? 0;
  }

  preload(): void {
    this.load.image("stage-select-background", assets.background);
    this.load.image("stage-select-star-small", assets.starCrossSmall);
    this.load.image("stage-select-star-medium", assets.starCrossMedium);
    this.load.image("stage-select-star-large", assets.starCrossLarge);
    this.load.image("stage-select-title-star", assets.titleStar);
    this.load.image("stage-select-constellation-star", assets.constellationStar);
    this.load.image("stage-select-zodiac", chapters[this.chapterIndex]!.zodiacUrl);
    this.load.font("Blrr Pixs", assets.font, "truetype");
  }

  create(): void {
    this.renderBackground();
    this.renderBackgroundStars();
    this.renderHeader(chapters[this.chapterIndex]!);
    this.renderConstellation(chapters[this.chapterIndex]!);
    this.createBackButton();
    this.input.keyboard?.on("keydown-ESC", this.back, this);
    this.input.keyboard?.on("keydown-BACKSPACE", this.back, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.cameras.main.fadeIn(this.reducedMotion ? 0 : 180, 8, 14, 20);
  }

  private renderBackground(): void {
    const background = this.add.image(WIDTH / 2, HEIGHT / 2, "stage-select-background");
    const source = background.texture.getSourceImage() as HTMLImageElement;
    background.setScale(Math.max(WIDTH / source.width, HEIGHT / source.height)).setDepth(-3);
  }

  private renderBackgroundStars(): void {
    backgroundStarGroups.forEach(({ key, width, height, positions }) => {
      positions.forEach(([x, y], index) => {
        const star = this.add
          .image((WIDTH * x) / 100, (HEIGHT * y) / 100, key)
          .setDisplaySize(width, height)
          .setAlpha(0.58 + (index % 5) * 0.08)
          .setDepth(BACKGROUND_STARS_DEPTH);
        if (!this.reducedMotion)
          this.tweens.add({
            targets: star,
            alpha: 0.82 + (index % 3) * 0.08,
            duration: 1600 + (index % 6) * 280,
            delay: (index % 5) * 240,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
          });
      });
    });
  }

  private renderHeader(chapter: ChapterDefinition): void {
    const content = this.add.container(WIDTH / 2, 80).setDepth(TITLE_DEPTH);
    const name = this.add.text(0, 0, chapter.sign, {
      color: "#ffffff",
      fontFamily: "Blrr Pixs",
      fontSize: "32px",
      letterSpacing: 2.56,
    });
    const iconWidth = 48;
    const iconHeight = 40;
    const contentGap = 16;
    const contentWidth = iconWidth + contentGap + name.width;
    const contentLeft = -contentWidth / 2;
    const centerY = name.height / 2;
    const icon = this.add
      .image(contentLeft + iconWidth / 2, centerY, "stage-select-zodiac")
      .setDisplaySize(iconWidth, iconHeight);
    name.setPosition(contentLeft + iconWidth + contentGap, 0);
    content.add([icon, name]);

    const starGap = 17.6;
    const starWidth = 16.3;
    const starHeight = 16;
    this.add
      .image(
        WIDTH / 2 - contentWidth / 2 - starGap - starWidth / 2,
        80 + centerY,
        "stage-select-title-star",
      )
      .setDisplaySize(starWidth, starHeight)
      .setDepth(TITLE_DEPTH);
    this.add
      .image(
        WIDTH / 2 + contentWidth / 2 + starGap + starWidth / 2,
        80 + centerY,
        "stage-select-title-star",
      )
      .setDisplaySize(starWidth, starHeight)
      .setDepth(TITLE_DEPTH);
  }

  private renderConstellation(chapter: ChapterDefinition): void {
    const bounds = { left: WIDTH * 0.2, right: WIDTH * 0.8, top: 180, bottom: 850 };
    const xs = chapter.constellation.map(({ x }) => x);
    const ys = chapter.constellation.map(({ y }) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const points = chapter.constellation.map(
      ({ x, y }) =>
        new Phaser.Math.Vector2(
          Phaser.Math.Linear(bounds.left, bounds.right, (x - minX) / (maxX - minX)),
          Phaser.Math.Linear(bounds.top, bounds.bottom, (y - minY) / (maxY - minY)),
        ),
    );
    const halo = this.add.graphics().lineStyle(18, GOLD, 0.13);
    const line = this.add.graphics().lineStyle(6, GOLD, 1);
    this.drawDashedLine(halo, points, 10, 14);
    this.drawDashedLine(line, points, 10, 14);
    line.filters?.external.addGlow(GOLD, 1.5, 0, 1, false, 6, 8).setPaddingOverride(null);

    points.forEach((point, stageIndex) => this.createStageNode(point, stageIndex));
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

  private createStageNode(point: Phaser.Math.Vector2, stageIndex: number): void {
    this.add
      .image(point.x, point.y, "stage-select-constellation-star")
      .setDisplaySize(142, 142)
      .setAlpha(0.2)
      .setBlendMode(Phaser.BlendModes.ADD);
    const star = this.add
      .image(point.x, point.y, "stage-select-constellation-star")
      .setDisplaySize(112, 112)
      .setInteractive({ useHandCursor: true });
    star.filters?.external.addGlow(GOLD, 1.5, 0, 1, false, 6, 8).setPaddingOverride(null);
    this.add
      .text(point.x, point.y + 86, `${stageIndex + 1}`.padStart(2, "0"), {
        color: "#83909a",
        fontFamily: "Blrr Pixs",
        fontSize: "28px",
        letterSpacing: 3,
      })
      .setOrigin(0.5, 0);
    star.on("pointerdown", () =>
      this.scene.start("game", { selection: { chapterIndex: this.chapterIndex, stageIndex } }),
    );
  }

  private createBackButton(): void {
    const button = this.add
      .text(48, 42, "BACK", {
        color: "#d7f9ff",
        fontFamily: "Blrr Pixs",
        fontSize: "22px",
        fontStyle: "bold",
        letterSpacing: 3,
      })
      .setInteractive({ useHandCursor: true });
    button.on("pointerdown", this.back, this);
    button.on("pointerover", () => button.setColor("#ffffff"));
    button.on("pointerout", () => button.setColor("#d7f9ff"));
  }

  private back(): void {
    this.scene.start("chapter", { activeIndex: this.chapterIndex });
  }

  private shutdown(): void {
    this.input.keyboard?.off("keydown-ESC", this.back, this);
    this.input.keyboard?.off("keydown-BACKSPACE", this.back, this);
  }
}
