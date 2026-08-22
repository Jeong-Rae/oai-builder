import { chapters, type ChapterDefinition } from "../../stages";
import { computeLayout } from "../../constellation/layout";
import { renderConstellationSvg } from "../../constellation/render";
import { createMoonDecor } from "../shared/moonDecor";
import { createBackgroundStars } from "../shared/backgroundStars";
import styles from "./scene.module.css";

const assets = {
  background: new URL("@/assets/background/background_space.png", import.meta.url).href,
  star: new URL("@/assets/star/star_plus_gold_s.png", import.meta.url).href,
  constellationStar: new URL("@/assets/star/star_stell_gold_m.png", import.meta.url).href,
  arrowLeft: new URL("@/assets/arrow/arrow_left.svg", import.meta.url).href,
  arrowRight: new URL("@/assets/arrow/arrow_right.svg", import.meta.url).href,
};

export function createChapterView(
  onMove: (offset: -1 | 1) => void,
  onSelect: () => void,
): { root: HTMLElement; setActive(index: number): void } {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${assets.background})`;
  const header = document.createElement("header");
  header.className = "scene-header";
  const title = document.createElement("h1");
  title.className = styles.title;
  title.append(titleStar(), document.createTextNode("CHAPTER SELECT"), titleStar());
  const divider = document.createElement("div");
  divider.className = "scene-divider";
  header.append(title, divider);
  const carousel = document.createElement("div");
  carousel.className = styles.carousel;
  const previous = createCard("previous", () => {});
  const current = createCard("current", onSelect);
  const next = createCard("next", () => {});
  carousel.append(previous, current, next);
  const left = arrow("이전 챕터", assets.arrowLeft, () => onMove(-1), styles.left);
  const right = arrow("다음 챕터", assets.arrowRight, () => onMove(1), styles.right);
  root.append(createBackgroundStars(), title, carousel, left, right, createMoonDecor());
  const cards = [previous, current, next];
  const setActive = (index: number) =>
    cards.forEach((card, cardIndex) =>
      renderCard(card, chapters[index + cardIndex - 1], cardIndex === 1),
    );
  setActive(0);
  return { root, setActive };
}

function titleStar(): HTMLImageElement {
  const image = document.createElement("img");
  image.src = assets.star;
  image.alt = "";
  return image;
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
function createCard(
  position: "previous" | "current" | "next",
  onClick: () => void,
): HTMLButtonElement {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `${styles.card} ${styles[position]}`;
  card.addEventListener("click", onClick);
  return card;
}
function renderCard(
  card: HTMLButtonElement,
  chapter: ChapterDefinition | undefined,
  enabled: boolean,
): void {
  card.replaceChildren();
  card.disabled = !enabled || !chapter;
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
    starUrl: assets.constellationStar,
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
