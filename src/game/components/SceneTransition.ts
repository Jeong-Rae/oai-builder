import { clearAssets, decorAssets } from "@/src/game/assets";
import styles from "@/src/game/components/SceneTransition.module.css";

export type SceneTransitionPhase = "covering" | "revealing";

const svgNamespace = "http://www.w3.org/2000/svg";
const meteors = [
  { source: decorAssets.starMedium, x: 90, y: 18, size: 2.5, delay: 120, duration: 720 },
  { source: clearAssets.spark, x: 92, y: 40, size: 2, delay: 80, duration: 760 },
  { source: decorAssets.starLarge, x: 95, y: 65, size: 3, delay: 40, duration: 800 },
  { source: clearAssets.spark, x: 98, y: 86, size: 2.25, delay: 0, duration: 840 },
] as const;

function createWave(): SVGSVGElement {
  const wave = document.createElementNS(svgNamespace, "svg");
  wave.classList.add(styles.wave);
  wave.setAttribute("viewBox", "0 0 2688 1080");
  wave.setAttribute("preserveAspectRatio", "none");
  const shape = document.createElementNS(svgNamespace, "path");
  shape.setAttribute(
    "d",
    "M60 0 C170 120 20 240 130 360 C250 480 80 600 190 720 C310 840 160 960 260 1080 L2640 1080 C2520 970 2670 850 2580 740 C2470 620 2660 510 2520 390 C2420 270 2520 130 2380 0 Z",
  );
  wave.append(shape);
  return wave;
}

function createMeteor(
  { source, x, y, size, delay, duration }: (typeof meteors)[number],
  index: number,
): HTMLElement {
  const meteor = document.createElement("span");
  meteor.className = styles.meteor;
  meteor.style.setProperty("--meteor-x", `${x}%`);
  meteor.style.setProperty("--meteor-y", `${y}%`);
  meteor.style.setProperty("--meteor-size", `${size}cqw`);
  meteor.style.setProperty("--meteor-delay", `${delay}ms`);
  meteor.style.setProperty("--meteor-duration", `${duration}ms`);
  meteor.style.setProperty("--meteor-color", index % 2 === 0 ? "215 249 255" : "247 211 111");
  const star = document.createElement("img");
  star.src = source;
  star.alt = "";
  meteor.append(star);
  return meteor;
}

export class SceneTransition {
  readonly element: HTMLElement;
  private readonly band: HTMLElement;

  constructor() {
    this.element = document.createElement("div");
    this.element.className = styles.root;
    this.element.setAttribute("aria-hidden", "true");
    this.band = document.createElement("div");
    this.band.className = styles.band;
    this.band.append(createWave(), ...meteors.map(createMeteor));
    this.element.append(this.band);
  }

  play(phase: SceneTransitionPhase): Promise<void> {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.setState(phase === "covering" ? styles.covered : undefined);
      return Promise.resolve();
    }

    const state = phase === "covering" ? styles.covering : styles.revealing;
    this.setState(state);
    return new Promise((resolve) => {
      const complete = (event: AnimationEvent): void => {
        if (event.target !== this.band) return;
        this.band.removeEventListener("animationend", complete);
        this.setState(phase === "covering" ? styles.covered : undefined);
        resolve();
      };
      this.band.addEventListener("animationend", complete);
    });
  }

  reset(): void {
    this.setState();
  }

  private setState(state?: string): void {
    this.element.className = state ? `${styles.root} ${state}` : styles.root;
  }
}
