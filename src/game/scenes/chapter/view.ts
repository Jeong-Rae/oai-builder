import { chapters, type ChapterDefinition } from "../../stages";
import { computeLayout } from "../../constellation/layout";
import { renderConstellationSvg } from "../../constellation/render";
import { createMoonDecor } from "../shared/moonDecor";
import { createBackgroundStars } from "../shared/backgroundStars";
import { createSceneTitle, createTitleStar } from "../shared/title";
import styles from "./scene.module.css";
import { backgroundUrl, chapterAssets } from "../../assets";

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
        card.onclick = onSelect;
      } else {
        card.onclick = null;
      }
      renderCard(card, chapter, offset === 2);
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
  enabled: boolean,
): void {
  card.replaceChildren();
  card.disabled = !chapter;
  card.tabIndex = enabled && chapter ? 0 : -1;
  card.setAttribute("aria-disabled", String(!enabled));
  card.setAttribute("aria-label", chapter ? `${chapter.sign} 챕터 선택` : "");
  if (chapter) card.append(constellation(chapter));
}
function constellation(chapter: ChapterDefinition): SVGSVGElement {
  const layout = computeLayout(chapter.constellation, {
    width: 450,
    height: 600,
    padding: { top: 100, left: 40, right: 40, bottom: 230 },
    emblemGap: 50,
    labelGap: 45,
    emblemSize: { width: 96, height: 80 },
  });
  const svg = renderConstellationSvg(layout, {
    starUrl: chapterAssets.constellationStar,
    starSize: 52,
    lineClass: styles.line,
  });
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${chapter.sign} 별자리`);
  const emblem = document.createElementNS("http://www.w3.org/2000/svg", "image");
  emblem.setAttribute("href", chapter.zodiacUrl);
  emblem.setAttribute("x", String(layout.emblemAnchor.x));
  emblem.setAttribute("y", String(layout.emblemAnchor.y));
  emblem.setAttribute("width", "96");
  emblem.setAttribute("height", "80");
  const name = document.createElementNS("http://www.w3.org/2000/svg", "text");
  name.setAttribute("class", styles.name);
  name.setAttribute("x", String(layout.labelAnchor.x));
  name.setAttribute("y", String(layout.labelAnchor.y));
  name.textContent = chapter.sign;
  svg.append(emblem, name);
  return svg;
}
