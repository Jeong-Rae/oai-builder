import {
  backgroundUrl,
  chapterAssets,
  chapterZodiacInactiveAssets,
  challengeDecorAssets,
  starNodeAssets,
} from "@/src/game/assets";
import { createBackButton } from "@/src/game/components/BackButton";
import { computeLayout } from "@/src/game/constellation/layout";
import { renderConstellationSvg } from "@/src/game/constellation/render";
import { signVisuals, type SignLineVisual } from "@/src/game/data/signVisuals";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import { createMoonDecor } from "@/src/game/scenes/shared/moonDecor";
import { createSceneTitle, createTitleStar } from "@/src/game/scenes/shared/title";
import styles from "@/src/game/scenes/chapter/scene.module.css";
import {
  isChapterCleared,
  isChapterUnlocked,
  stageStatuses,
  type ChapterDefinition,
  visibleChapters,
} from "@/src/game/stages";

const svgNamespace = "http://www.w3.org/2000/svg";
const cardGap = 0.26615;

export function chapterMoveFromDrag(distance: number, width: number): -1 | 0 | 1 {
  if (Math.abs(distance) < width * cardGap * 0.5) return 0;
  return distance > 0 ? -1 : 1;
}

export function createChapterView(
  onMove: (offset: -1 | 1) => void,
  onSelect: (index: number) => void,
  onBack: () => void,
): { root: HTMLElement; setActive(index: number): void } {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  const header = document.createElement("header");
  header.className = "scene-header";
  const titleText = document.createElement("span");
  titleText.textContent = "CHAPTER SELECT";
  const dividerStar = document.createElement("img");
  dividerStar.src = starNodeAssets.black;
  dividerStar.alt = "";
  header.append(
    createSceneTitle("chapter", createTitleStar(), titleText, createTitleStar(), dividerStar),
  );
  const carousel = document.createElement("div");
  carousel.className = styles.carousel;
  const cards = Array.from({ length: 5 }, () => createCard());
  carousel.append(...cards);
  attachDrag(carousel, () => activeIndex, onMove);
  const left = arrow("이전 챕터", chapterAssets.arrowLeft, () => onMove(-1), styles.left);
  const right = arrow("다음 챕터", chapterAssets.arrowRight, () => onMove(1), styles.right);
  root.append(
    createBackgroundStars(),
    header,
    carousel,
    left,
    right,
    createBackButton("메인 화면으로 돌아가기", onBack, styles.back),
    createMoonDecor(),
  );
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
      const choiceIndex = index + offset - 2;
      const chapter = visibleChapters[choiceIndex - 1];
      const valid = choiceIndex >= 0 && choiceIndex <= visibleChapters.length;
      if (!valid) {
        card.onclick = null;
      } else if (offset === 1) {
        card.onclick = () => onMove(-1);
      } else if (offset === 3) {
        card.onclick = () => onMove(1);
      } else if (offset === 2) {
        card.onclick = () => onSelect(choiceIndex);
      } else {
        card.onclick = null;
      }
      renderCard(card, choiceIndex, chapter, offset === 2);
    });
    left.disabled = index === 0;
    right.disabled = index === visibleChapters.length;
    activeIndex = index;
    hasRendered = true;
  };
  setActive(0);
  return { root, setActive };
}

function attachDrag(
  carousel: HTMLElement,
  activeIndex: () => number,
  onMove: (offset: -1 | 1) => void,
): void {
  let pointerId: number | undefined;
  let startX = 0;
  let distance = 0;
  let dragged = false;
  let suppressClick = false;

  carousel.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    distance = 0;
    dragged = false;
    carousel.classList.add(styles.dragging);
  });
  carousel.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    const limit = carousel.clientWidth * cardGap;
    distance = Math.max(-limit, Math.min(limit, event.clientX - startX));
    if (!dragged && Math.abs(distance) > 5) {
      dragged = true;
      carousel.setPointerCapture(pointerId);
    }
    carousel.style.setProperty("--drag-x", `${distance}px`);
  });
  carousel.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = undefined;
    carousel.classList.remove(styles.dragging);
    const offset = chapterMoveFromDrag(distance, carousel.clientWidth);
    if (
      offset !== 0 &&
      ((offset < 0 && activeIndex() > 0) || (offset > 0 && activeIndex() < visibleChapters.length))
    )
      onMove(offset);
    carousel.style.removeProperty("--drag-x");
    suppressClick = dragged;
  });
  carousel.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = undefined;
    carousel.classList.remove(styles.dragging);
    carousel.style.removeProperty("--drag-x");
  });
  carousel.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
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
  card.dataset.clickStars = "";
  return card;
}
function renderCard(
  card: HTMLButtonElement,
  choiceIndex: number,
  chapter: ChapterDefinition | undefined,
  enabled: boolean,
): void {
  card.replaceChildren();
  const challenge = choiceIndex === 0;
  card.disabled = !challenge && !chapter;
  const chapterIndex = choiceIndex - 1;
  const unlocked = challenge || (chapter ? isChapterUnlocked(chapterIndex) : false);
  const cleared = chapter ? isChapterCleared(chapterIndex) : false;
  card.tabIndex = enabled ? 0 : -1;
  card.setAttribute("aria-disabled", "false");
  card.setAttribute(
    "aria-label",
    challenge ? "오늘의 챌린지 선택" : chapter ? `${chapter.sign} 챕터 선택` : "",
  );
  if (challenge) card.append(challengeConstellation());
  else if (chapter) card.append(constellation(chapter, chapterIndex, enabled, unlocked, cleared));
}

function challengeConstellation(): SVGSVGElement {
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", "0 0 478 560");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "반짝이는 큰 노란별 모양의 오늘의 챌린지");

  const star = document.createElementNS(svgNamespace, "image");
  setImageBox(star, starNodeAssets.gold, 69, 13, 340, 340);
  const glow = star.cloneNode() as SVGImageElement;
  glow.setAttribute("class", `${styles.glow} ${styles.goldGlow} ${styles.challengeGlow}`);
  svg.append(glow, star);

  [
    [challengeDecorAssets.stellSmall, 18, 88, 38, 38, "0s"],
    [challengeDecorAssets.plus, 424, 142, 34, 37, "0.7s"],
    [challengeDecorAssets.stellSmall, 34, 254, 24, 23, "1.4s"],
    [challengeDecorAssets.stellSmall, 420, 285, 24, 24, "2.1s"],
  ].forEach(([source, x, y, width, height, delay]) => {
    const sparkle = document.createElementNS(svgNamespace, "image");
    sparkle.setAttribute("class", styles.challengeSparkle);
    sparkle.style.setProperty("--sparkle-delay", delay as string);
    setImageBox(
      sparkle,
      source as string,
      x as number,
      y as number,
      width as number,
      height as number,
    );
    svg.append(sparkle);
  });
  const title = document.createElementNS(svgNamespace, "text");
  title.setAttribute("class", styles.challengeTitle);
  title.setAttribute("x", "239");
  title.setAttribute("y", "430");
  title.textContent = "CHALLENGE";
  svg.append(title);
  return svg;
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
    lineClass: `${styles.line} ${cleared ? "" : styles.lineInactive}`,
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

  svg.append(createLine(visual.line, cleared));
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

function createLine(visual: SignLineVisual, cleared: boolean): SVGImageElement {
  const image = document.createElementNS(svgNamespace, "image");
  const source = cleared
    ? (visual.activeUrl ?? visual.url)
    : (visual.inactiveUrl ?? visual.lockedUrl ?? visual.url);
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
