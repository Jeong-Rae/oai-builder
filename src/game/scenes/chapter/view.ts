import {
  backgroundUrl,
  chapterAssets,
  chapterZodiacInactiveAssets,
  starNodeAssets,
} from "@/src/game/assets";
import { computeLayout } from "@/src/game/constellation/layout";
import { renderConstellationSvg } from "@/src/game/constellation/render";
import { signVisuals, type SignLineVisual } from "@/src/game/data/signVisuals";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import { createMoonDecor } from "@/src/game/scenes/shared/moonDecor";
import { createSceneTitle, createTitleStar } from "@/src/game/scenes/shared/title";
import styles from "@/src/game/scenes/chapter/scene.module.css";
import {
  chapters,
  isChapterCleared,
  isChapterUnlocked,
  stageStatuses,
  type ChapterDefinition,
} from "@/src/game/stages";

const svgNamespace = "http://www.w3.org/2000/svg";

export function createChapterView(
  onMove: (offset: -1 | 1) => void,
  onSelect: () => void,
): { root: HTMLElement; setActive(index: number): void } {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  const header = document.createElement("header");
  header.className = "scene-header";
  const titleText = document.createElement("span");
  titleText.textContent = "CHAPTER SELECT";
  header.append(createSceneTitle(createTitleStar(), titleText, createTitleStar()));
  const carousel = document.createElement("div");
  carousel.className = styles.carousel;
  const cards = Array.from({ length: 5 }, () => createCard());
  carousel.append(...cards);
  const left = arrow("이전 챕터", chapterAssets.arrowLeft, () => onMove(-1), styles.left);
  const right = arrow("다음 챕터", chapterAssets.arrowRight, () => onMove(1), styles.right);
  root.append(createBackgroundStars(), header, carousel, left, right, createMoonDecor());
  let slots = [...cards];
  let activeIndex = 0;
  let hasRendered = false;
  const setActive = (index: number) => {
    if (hasRendered) {
      const delta = index - activeIndex;
      if (delta > 0) {
        for (let i = 0; i < delta; i += 1) slots.push(slots.shift()!);
      } else if (delta < 0) {
        for (let i = 0; i < -delta; i += 1) slots.unshift(slots.pop()!);
      } else {
        slots = [...cards];
      }
    }

    const roles = ["outLeft", "previous", "current", "next", "outRight"] as const;
    slots.forEach((card, offset) => {
      card.className = `${styles.card} ${styles[roles[offset]]}`;
      const chapter = chapters[index + offset - 2];
      if (!chapter) {
        card.onclick = null;
      } else if (offset === 1) {
        card.onclick = () => onMove(-1);
      } else if (offset === 3) {
        card.onclick = () => onMove(1);
      } else if (offset === 2) {
        card.onclick = isChapterUnlocked(index) ? onSelect : null;
      } else {
        card.onclick = null;
      }
      renderCard(card, chapter, index + offset - 2, offset === 2);
    });
    left.disabled = index === 0;
    right.disabled = index === chapters.length - 1;
    activeIndex = index;
    hasRendered = true;
  };
  setActive(0);
  return { root, setActive };
}

function arrow(
  label: string,
  source: string,
  onClick: () => void,
  position: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `${styles.arrow} ${position}`;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  const image = document.createElement("img");
  image.src = source;
  image.alt = "";
  button.append(image);
  return button;
}
function createCard(): HTMLButtonElement {
  const card = document.createElement("button");
  card.type = "button";
  return card;
}
function renderCard(
  card: HTMLButtonElement,
  chapter: ChapterDefinition | undefined,
  chapterIndex: number,
  enabled: boolean,
): void {
  card.replaceChildren();
  card.disabled = !chapter;
  const unlocked = chapter ? isChapterUnlocked(chapterIndex) : false;
  const cleared = chapter ? isChapterCleared(chapterIndex) : false;
  card.tabIndex = enabled && unlocked ? 0 : -1;
  card.setAttribute("aria-disabled", String(enabled && !unlocked));
  card.setAttribute("aria-label", chapter ? `${chapter.sign} 챕터 선택` : "");
  if (chapter) card.append(constellation(chapter, chapterIndex, enabled, unlocked, cleared));
}
function constellation(
  chapter: ChapterDefinition,
  chapterIndex: number,
  active: boolean,
  unlocked: boolean,
  cleared: boolean,
): SVGSVGElement {
  const visual = signVisuals[chapter.sign]?.chapter[active ? "large" : "small"];
  if (visual) return renderFigmaConstellation(chapter, chapterIndex, visual, unlocked, cleared);

  const layout = computeLayout(chapter.constellation, {
    width: 478,
    height: 560,
    padding: { top: 100, left: 40, right: 40, bottom: 230 },
    emblemGap: 100,
    emblemSize: { width: 110, height: 90 },
  });
  const svg = renderConstellationSvg(layout, {
    starUrl: starNodeAssets.gray,
    starSize: active ? 84 : 70,
    lineClass: `${styles.line} ${active ? "" : styles.lineInactive}`,
  });
  const statuses = stageStatuses(chapterIndex);
  svg.querySelectorAll("image").forEach((star, index) => {
    const cleared = active && statuses[index] === "cleared";
    star.setAttribute("href", cleared ? starNodeAssets.gold : starNodeAssets.gray);
    const glow = star.cloneNode() as SVGImageElement;
    glow.setAttribute("class", `${styles.glow} ${cleared ? styles.goldGlow : styles.grayGlow}`);
    star.before(glow);
  });
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${chapter.sign} 별자리`);
  const emblem = document.createElementNS("http://www.w3.org/2000/svg", "image");
  emblem.setAttribute(
    "href",
    cleared ? chapter.zodiacUrl : chapterZodiacInactiveAssets[chapter.sign],
  );
  emblem.setAttribute("x", String(layout.emblemAnchor.x));
  emblem.setAttribute("y", String(layout.emblemAnchor.y));
  emblem.setAttribute("width", "110");
  emblem.setAttribute("height", "90");
  svg.append(emblem);
  return svg;
}

function renderFigmaConstellation(
  chapter: ChapterDefinition,
  chapterIndex: number,
  visual: NonNullable<(typeof signVisuals)[keyof typeof signVisuals]>["chapter"]["large"],
  unlocked: boolean,
  cleared: boolean,
): SVGSVGElement {
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", `0 0 ${visual.width} ${visual.height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${chapter.sign} 별자리`);

  svg.append(createLine(visual.line, unlocked));
  const statuses = unlocked
    ? stageStatuses(chapterIndex)
    : Array.from({ length: visual.stars.length }, () => "locked" as const);
  visual.stars.forEach((point, index) => {
    const status = statuses[index] ?? "locked";
    const source =
      status === "cleared"
        ? starNodeAssets.gold
        : status === "locked"
          ? starNodeAssets.gray
          : starNodeAssets.white;
    const star = document.createElementNS(svgNamespace, "image");
    setImageBox(star, source, point.x, point.y, point.size, point.size);
    if (point.rotation) {
      const centerX = point.x + point.size / 2;
      const centerY = point.y + point.size / 2;
      star.setAttribute("transform", `rotate(${point.rotation} ${centerX} ${centerY})`);
    }
    const glow = star.cloneNode() as SVGImageElement;
    glow.setAttribute(
      "class",
      `${styles.glow} ${status === "cleared" ? styles.goldGlow : styles.grayGlow}`,
    );
    svg.append(glow, star);
  });

  const emblem = document.createElementNS(svgNamespace, "image");
  setImageBox(
    emblem,
    cleared ? chapter.zodiacUrl : chapterZodiacInactiveAssets[chapter.sign],
    visual.emblem.x,
    visual.emblem.y,
    visual.emblem.width,
    visual.emblem.height,
  );
  svg.append(emblem);
  return svg;
}

function createLine(visual: SignLineVisual, unlocked: boolean): SVGImageElement {
  const image = document.createElementNS(svgNamespace, "image");
  const source = unlocked ? (visual.activeUrl ?? visual.url) : (visual.lockedUrl ?? visual.url);
  const x = visual.centered ? visual.x - visual.width / 2 : visual.x;
  const y = visual.centered ? visual.y - visual.height / 2 : visual.y;
  setImageBox(image, source, x, y, visual.width, visual.height);
  if (visual.rotation) {
    const centerX = visual.centered ? visual.x : visual.x + visual.width / 2;
    const centerY = visual.centered ? visual.y : visual.y + visual.height / 2;
    image.setAttribute("transform", `rotate(${visual.rotation} ${centerX} ${centerY})`);
  }
  return image;
}

function setImageBox(
  image: SVGImageElement,
  source: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  image.setAttribute("href", source);
  image.setAttribute("x", String(x));
  image.setAttribute("y", String(y));
  image.setAttribute("width", String(width));
  image.setAttribute("height", String(height));
}
