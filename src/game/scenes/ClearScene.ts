import Phaser from 'phaser';

import { nextSelection, type PlaySelection } from '../stages';

const WIDTH = 1920;
const HEIGHT = 1080;
const backgroundUrl = new URL('@/assets/background/background_space.png', import.meta.url).href;
const fontUrl = new URL('@/assets/fonts/blrrpixs016.ttf', import.meta.url).href;
const sparkUrl = new URL('@/assets/star/star_plus_gold_s.png', import.meta.url).href;

export class ClearScene extends Phaser.Scene {
  private selection: PlaySelection = { chapterIndex: 0, stageIndex: 0 };
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private readonly onExitHome: () => void = () => {}) {
    super('clear');
  }

  init(data: { selection?: PlaySelection } = {}): void {
    this.selection = data.selection ?? this.selection;
  }

  preload(): void {
    this.load.image('clear-background', backgroundUrl);
    this.load.image('clear-spark', sparkUrl);
    this.load.font('Blrr Pixs', fontUrl, 'truetype');
  }

  create(): void {
    this.renderBackground();
    this.add.text(WIDTH / 2, 330, 'STAGE CLEAR!', {
      color: '#ffffff',
      fontFamily: 'Blrr Pixs',
      fontSize: '72px',
      fontStyle: 'bold',
      letterSpacing: 7,
    }).setOrigin(0.5);
    this.renderCelebration();
    this.createButton(630, 710, 'NEXT', () => this.next());
    this.createButton(960, 710, 'RETRY', () => this.retry());
    this.createButton(1290, 710, 'HOME', this.onExitHome);

    this.input.keyboard?.on('keydown-ENTER', this.next, this);
    this.input.keyboard?.on('keydown-R', this.retry, this);
    this.input.keyboard?.on('keydown-H', this.onExitHome);
    this.input.keyboard?.on('keydown-ESC', this.onExitHome);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.cameras.main.fadeIn(this.reducedMotion ? 0 : 180, 8, 14, 20);
  }

  private renderBackground(): void {
    const background = this.add.image(WIDTH / 2, HEIGHT / 2, 'clear-background');
    const source = background.texture.getSourceImage() as HTMLImageElement;
    background.setScale(Math.max(WIDTH / source.width, HEIGHT / source.height)).setDepth(-2);
  }

  private renderCelebration(): void {
    for (let index = 0; index < 18; index += 1) {
      const angle = Phaser.Math.DegToRad(index * 20);
      const distance = 155 + (index % 3) * 35;
      const spark = this.add.image(WIDTH / 2, 500, 'clear-spark').setDisplaySize(24, 24).setAlpha(0);
      const baseScale = spark.scaleX;

      if (this.reducedMotion) {
        spark.setPosition(WIDTH / 2 + Math.cos(angle) * distance, 500 + Math.sin(angle) * distance).setAlpha(0.7);
        continue;
      }

      this.tweens.add({
        targets: spark,
        x: WIDTH / 2 + Math.cos(angle) * distance,
        y: 500 + Math.sin(angle) * distance,
        alpha: { from: 0, to: 0.9 },
        scaleX: { from: baseScale * 0.35, to: baseScale * 1.25 },
        scaleY: { from: baseScale * 0.35, to: baseScale * 1.25 },
        duration: 900,
        delay: (index % 3) * 70,
        ease: 'Cubic.easeOut',
        yoyo: true,
        repeat: -1,
        repeatDelay: 250,
      });
    }
  }

  private createButton(x: number, y: number, label: string, onPress: () => void): void {
    const button = this.add.text(x, y, label, {
      backgroundColor: '#d7f9ff',
      color: '#080e14',
      fontFamily: 'Blrr Pixs',
      fontSize: '28px',
      fontStyle: 'bold',
      padding: { x: 36, y: 18 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerdown', onPress);
    button.on('pointerover', () => button.setBackgroundColor('#81f0c5').setScale(1.05));
    button.on('pointerout', () => button.setBackgroundColor('#d7f9ff').setScale(1));
  }

  private next(): void {
    this.scene.start('game', { selection: nextSelection(this.selection) });
  }

  private retry(): void {
    this.scene.start('game', { selection: this.selection });
  }

  private shutdown(): void {
    this.input.keyboard?.off('keydown-ENTER', this.next, this);
    this.input.keyboard?.off('keydown-R', this.retry, this);
    this.input.keyboard?.off('keydown-H', this.onExitHome);
    this.input.keyboard?.off('keydown-ESC', this.onExitHome);
  }
}
