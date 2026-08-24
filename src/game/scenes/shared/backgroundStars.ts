import { clearAssets, decorAssets } from "@/src/game/assets";
import styles from "@/src/game/scenes/shared/backgroundStars.module.css";

const positions = [
  [85.5, 60.5],
  [41.6, 42],
  [93.6, 48.2],
  [47.5, 21.8],
  [87.5, 11.1],
  [37.2, 86],
  [53.8, 29.6],
  [20.1, 38.4],
  [16.5, 87.4],
  [4.3, 67.8],
  [90.2, 90.6],
  [69.3, 34.2],
  [61, 31],
  [34.5, 40.1],
  [72.8, 30.2],
  [90.5, 17.1],
  [5.6, 75.7],
  [42.7, 88.3],
  [13.9, 34.3],
  [68.1, 25.5],
] as const;

const interactiveSelector = "button, a, input, select, textarea, [role='button']";
const sparkleTargetSelector = "[data-click-stars]";
const clickStars = [
  {
    source: decorAssets.starLarge,
    size: "1.4cqw",
    x: "-1.4cqw",
    y: "-1.5cqw",
    midX: "-0.55cqw",
    midY: "-0.65cqw",
    rotation: "-15deg",
    delay: "0ms",
  },
  {
    source: decorAssets.starMedium,
    size: "1cqw",
    x: "1.55cqw",
    y: "-0.35cqw",
    midX: "0.65cqw",
    midY: "-0.15cqw",
    rotation: "12deg",
    delay: "60ms",
  },
  {
    source: decorAssets.starSmall,
    size: "0.7cqw",
    x: "-0.15cqw",
    y: "1.5cqw",
    midX: "-0.05cqw",
    midY: "0.6cqw",
    rotation: "24deg",
    delay: "110ms",
  },
] as const;

export function isInteractiveClickTarget(target: {
  closest(selector: string): Element | null;
}): boolean {
  return (
    target.closest(sparkleTargetSelector) === null && target.closest(interactiveSelector) !== null
  );
}

export function pickYellowStarIndexes(random: () => number = Math.random): ReadonlySet<number> {
  const first = Math.floor(random() * clickStars.length);
  const indexes = new Set([first]);
  if (random() >= 0.5)
    indexes.add((first + 1 + Math.floor(random() * (clickStars.length - 1))) % clickStars.length);
  return indexes;
}

export function randomBurstTransform(random: () => number = Math.random): string {
  const rotation = Math.round(random() * 359);
  const scale = Math.round((0.8 + random() * 0.4) * 100) / 100;
  return `rotate(${rotation}deg) scale(${scale})`;
}

export function attachClickStars(frame: HTMLElement): void {
  let pointerId: number | undefined;
  let lastX = 0;
  let lastY = 0;
  let dragged = false;
  let suppressClick = false;

  frame.addEventListener("pointerdown", (event) => {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      !(event.target instanceof Element) ||
      isInteractiveClickTarget(event.target)
    )
      return;
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    dragged = false;
  });
  frame.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId || (event.buttons & 1) === 0) return;
    const spacing = Math.max(12, frame.clientWidth * 0.015);
    if (Math.hypot(event.clientX - lastX, event.clientY - lastY) < spacing) return;
    lastX = event.clientX;
    lastY = event.clientY;
    dragged = true;
    createBurst(frame, event.clientX, event.clientY);
  });
  const endDrag = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    pointerId = undefined;
    suppressClick = event.type === "pointerup" && dragged;
  };
  frame.addEventListener("pointerup", endDrag);
  frame.addEventListener("pointercancel", endDrag);
  frame.addEventListener("click", (event) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (!(event.target instanceof Element) || isInteractiveClickTarget(event.target)) return;
    createBurst(frame, event.clientX, event.clientY);
  });
}

function createBurst(frame: HTMLElement, clientX: number, clientY: number): void {
  const frameBox = frame.getBoundingClientRect();
  const burst = document.createElement("div");
  const yellowIndexes = pickYellowStarIndexes();
  burst.className = styles.burst;
  burst.setAttribute("aria-hidden", "true");
  burst.style.transform = randomBurstTransform();
  burst.style.setProperty("--x", `${clientX - frameBox.left}px`);
  burst.style.setProperty("--y", `${clientY - frameBox.top}px`);

  clickStars.forEach(({ source, size, x, y, midX, midY, rotation, delay }, index) => {
    const star = document.createElement("img");
    star.className = styles.burstStar;
    star.src = yellowIndexes.has(index) ? clearAssets.spark : source;
    star.alt = "";
    star.style.setProperty("--size", size);
    star.style.setProperty("--end-x", x);
    star.style.setProperty("--end-y", y);
    star.style.setProperty("--mid-x", midX);
    star.style.setProperty("--mid-y", midY);
    star.style.setProperty("--rotation", rotation);
    star.style.setProperty("--delay", delay);
    if (index === clickStars.length - 1) {
      star.addEventListener("animationend", () => burst.remove(), { once: true });
    }
    burst.append(star);
  });

  frame.append(burst);
}

export function createBackgroundStars(): HTMLElement {
  const stars = document.createElement("div");
  stars.className = styles.stars;
  stars.setAttribute("aria-hidden", "true");
  positions.forEach(([x, y], index) => {
    const star = document.createElement("img");
    star.className = `${styles.star} ${index < 11 ? styles.small : index < 16 ? styles.medium : styles.large}`;
    star.src =
      index < 11
        ? decorAssets.starSmall
        : index < 16
          ? decorAssets.starMedium
          : decorAssets.starLarge;
    star.alt = "";
    star.style.setProperty("--x", `${x}%`);
    star.style.setProperty("--y", `${y}%`);
    stars.append(star);
  });
  return stars;
}
