import { createPlateButton } from "../components/PlateButton";

const assets = {
  background: new URL("@/assets/background/background_space.png", import.meta.url).href,
  lunar: new URL("@/assets/moon/moon.eclepse.trimmed.png", import.meta.url).href,
  mascots: [
    new URL("@/assets/mascot/mascot.happy.1.png", import.meta.url).href,
    new URL("@/assets/mascot/mascot.happy.2.png", import.meta.url).href,
  ],
  starConcave: new URL("@/assets/star/star_concave.png", import.meta.url).href,
  starConvex: new URL("@/assets/star/star_convex.png", import.meta.url).href,
  starCrossSmall: new URL("@/assets/star/star_cross_s.png", import.meta.url).href,
  starCrossMedium: new URL("@/assets/star/star_cross_m.png", import.meta.url).href,
  starCrossLarge: new URL("@/assets/star/star_cross_l.png", import.meta.url).href,
};

const starPositions = [
  ["8%", "14%"],
  ["33%", "-16%"],
  ["66%", "5%"],
  ["91%", "28%"],
  ["4%", "74%"],
  ["29%", "110%"],
  ["70%", "105%"],
  ["95%", "75%"],
] as const;
const backgroundStarGroups = [
  {
    source: assets.starCrossSmall,
    size: "small",
    positions: [
      [85.5, 60.5],
      [41.6, 42.0],
      [93.6, 48.2],
      [47.5, 21.8],
      [87.5, 11.1],
      [37.2, 86.0],
      [53.8, 29.6],
      [20.1, 38.4],
      [87.3, 59.2],
      [15.1, 19.1],
      [34.1, 19.6],
    ],
  },
  {
    source: assets.starCrossMedium,
    size: "medium",
    positions: [
      [16.5, 87.4],
      [4.3, 67.8],
      [90.2, 90.6],
      [69.3, 34.2],
      [61.0, 31.0],
      [34.5, 40.1],
      [72.8, 30.2],
    ],
  },
  {
    source: assets.starCrossLarge,
    size: "large",
    positions: [
      [90.5, 17.1],
      [5.6, 75.7],
      [42.7, 88.3],
      [13.9, 34.3],
      [68.1, 25.5],
    ],
  },
] as const;

export function createStartScene(onComplete: () => void): {
  view: HTMLElement;
  dispose: () => void;
} {
  const scene = new StartScene(onComplete);
  return { view: scene.render(), dispose: scene.dispose };
}

class StartScene {
  private readonly view = this.renderView();

  constructor(private readonly onComplete: () => void) {}

  render(): HTMLElement {
    this.view.append(
      this.renderBackgroundStars(),
      this.renderLunar(),
      this.renderMascot(),
      this.renderStartArea(),
    );
    return this.view;
  }

  dispose = (): void => {};

  private renderView(): HTMLElement {
    const view = document.createElement("main");
    view.className = "game-menu game-intro";
    view.style.backgroundImage = `url(${assets.background})`;
    return view;
  }

  private renderLunar(): HTMLImageElement {
    const lunar = document.createElement("img");
    lunar.className = "game-intro__lunar";
    lunar.src = assets.lunar;
    lunar.alt = "";
    return lunar;
  }

  private renderMascot(): HTMLImageElement {
    const mascot = document.createElement("img");
    mascot.className = "game-intro__mascot";
    mascot.src = assets.mascots[Math.floor(Math.random() * assets.mascots.length)]!;
    mascot.alt = "";
    mascot.setAttribute("aria-hidden", "true");
    return mascot;
  }

  private renderBackgroundStars(): HTMLElement {
    const stars = document.createElement("div");
    stars.className = "game-intro__background-stars";
    stars.setAttribute("aria-hidden", "true");
    backgroundStarGroups.forEach(({ source, positions, size }) => {
      positions.forEach((position) =>
        stars.append(this.renderBackgroundStar(source, size, position)),
      );
    });
    return stars;
  }

  private renderBackgroundStar(
    source: string,
    size: "small" | "medium" | "large",
    [x, y]: readonly [number, number],
  ): HTMLImageElement {
    const star = document.createElement("img");
    star.className = `game-intro__background-star game-intro__background-star--${size}`;
    star.src = source;
    star.alt = "";
    star.style.setProperty("--x", `${x}%`);
    star.style.setProperty("--y", `${y}%`);
    return star;
  }

  private renderStartArea(): HTMLElement {
    const area = document.createElement("div");
    area.className = "game-intro__start-area";
    area.append(this.renderStars(), this.renderStartButton());
    return area;
  }

  private renderStars(): HTMLElement {
    const stars = document.createElement("div");
    stars.className = "game-intro__stars";
    stars.setAttribute("aria-hidden", "true");
    starPositions.forEach((position, index) => stars.append(this.renderStar(position, index)));
    return stars;
  }

  private renderStar(position: readonly [string, string], index: number): HTMLImageElement {
    const star = document.createElement("img");
    star.src = index % 2 ? assets.starConvex : assets.starConcave;
    this.positionStar(star, position);
    return star;
  }

  private positionStar(star: HTMLImageElement, [x, y]: readonly [string, string]): void {
    star.style.setProperty("--x", x);
    star.style.setProperty("--y", y);
  }

  private renderStartButton(): HTMLButtonElement {
    const start = createPlateButton("START", this.onComplete);
    start.classList.add("game-intro__start");
    return start;
  }
}
