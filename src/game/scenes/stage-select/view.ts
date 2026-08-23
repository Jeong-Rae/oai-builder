import {
  backgroundUrl,
  chapterZodiacInactiveAssets,
  stageSelectAssets as assets,
  starNodeAssets,
} from "@/src/game/assets";
import { createBackButton } from "@/src/game/components/BackButton";
import { computeLayout } from "@/src/game/constellation/layout";
import { renderConstellationSvg } from "@/src/game/constellation/render";
import { signVisuals, type StageSignVisual } from "@/src/game/data/signVisuals";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import { createMoonDecor } from "@/src/game/scenes/shared/moonDecor";
import { createSceneTitle, createTitleStar } from "@/src/game/scenes/shared/title";
import styles from "@/src/game/scenes/stage-select/scene.module.css";
import { isChapterCleared, type ChapterDefinition, stageStatuses } from "@/src/game/stages";

const nodeImageByStatus = {
  cleared: starNodeAssets.gold,
  current: starNodeAssets.white,
  available: starNodeAssets.white,
  locked: starNodeAssets.black,
} as const;

function createHeader(chapter: ChapterDefinition, chapterIndex: number): HTMLElement {
  const header = document.createElement("header");
  header.className = "scene-header";
  const zodiac = document.createElement("img");
  zodiac.src = isChapterCleared(chapterIndex)
    ? chapter.zodiacUrl
    : chapterZodiacInactiveAssets[chapter.sign];
  zodiac.alt = "";
  const sign = document.createElement("span");
  sign.textContent = chapter.sign;
  const titleText = document.createElement("span");
  titleText.className = styles.titleText;
  titleText.append(zodiac, sign);
  const label = document.createElement("p");
  label.className = styles.chapterLabel;
  label.textContent = `CHAPTER  ${String(chapterIndex + 1).padStart(2, "0")}`;
  header.append(createSceneTitle("stage", createTitleStar(), titleText, createTitleStar()), label);
  return header;
}

type StageStatus = ReturnType<typeof stageStatuses>[number];

function createStageNode(
  stageIndex: number,
  status: StageStatus,
  onStage: (index: number) => void,
  className = styles.node,
): HTMLButtonElement {
  const node = document.createElement("button");
  const number = stageIndex + 1;
  node.type = "button";
  node.className = className;
  node.dataset.status = status;
  node.disabled = status === "locked";
  node.setAttribute(
    "aria-label",
    status === "locked"
      ? `${number} 스테이지 잠김`
      : status === "cleared"
        ? `${number} 스테이지 다시 플레이`
        : `${number} 스테이지 시작`,
  );
  appendNodeStatusAssets(node, status);
  if (status !== "locked") node.addEventListener("click", () => onStage(stageIndex));
  return node;
}

function appendNodeStatusAssets(node: HTMLElement, status: StageStatus): void {
  const star = document.createElement("img");
  star.className = styles.star;
  star.src = nodeImageByStatus[status];
  star.alt = "";
  if (status === "cleared") {
    const glow = star.cloneNode() as HTMLImageElement;
    glow.className = styles.glow;
    node.append(glow);
  }
  node.append(star);
  if (status !== "current") return;
  const ring = document.createElement("span");
  ring.className = styles.ring;
  const bubble = document.createElement("span");
  bubble.className = styles.bubble;
  bubble.textContent = "NEXT";
  bubble.style.backgroundImage = `url(${assets.bubbleNext})`;
  node.append(ring, bubble);
}

function appendNodeLabel(node: HTMLElement, stageIndex: number): HTMLSpanElement {
  const label = document.createElement("span");
  label.className = styles.num;
  label.textContent = String(stageIndex + 1).padStart(2, "0");
  node.append(label);
  return label;
}

function createNode(
  stageIndex: number,
  point: { x: number; y: number },
  layoutWidth: number,
  layoutHeight: number,
  status: StageStatus,
  onStage: (index: number) => void,
): HTMLButtonElement {
  const node = createStageNode(stageIndex, status, onStage);
  node.style.setProperty("--x", `${(point.x / layoutWidth) * 100}%`);
  node.style.setProperty("--y", `${(point.y / layoutHeight) * 100}%`);
  appendNodeLabel(node, stageIndex);
  return node;
}

function createFigmaNode(
  stageIndex: number,
  point: StageSignVisual["stars"][number],
  status: StageStatus,
  onStage: (index: number) => void,
): HTMLButtonElement {
  const node = createStageNode(stageIndex, status, onStage, `${styles.node} ${styles.exactNode}`);
  node.style.left = `${(point.x / 1920) * 100}%`;
  node.style.top = `${(point.y / 1080) * 100}%`;
  node.style.width = `${(point.size / 1920) * 100}%`;
  const label = appendNodeLabel(node, stageIndex);
  label.style.left = `${((point.labelX - point.x) / point.size) * 100}%`;
  label.style.top = `${((point.labelY - point.y) / point.size) * 100}%`;
  return node;
}

export function createStageSelectView(
  chapter: ChapterDefinition,
  chapterIndex: number,
  onStage: (index: number) => void,
  onBack: () => void,
): HTMLElement {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  const statuses = stageStatuses(chapterIndex);
  const visual = signVisuals[chapter.sign]?.stage;
  const constellation = visual ? createFigmaLine(visual) : createFallbackLine(chapter);
  const nodes = document.createElement("div");
  nodes.className = visual ? styles.exactNodes : styles.nodes;
  if (visual) {
    visual.stars.forEach((point, index) => {
      nodes.append(createFigmaNode(index, point, statuses[index]!, onStage));
    });
  } else {
    const layout = computeLayout(chapter.constellation, {
      width: 1000,
      height: 670,
      padding: { top: 50, right: 80, bottom: 50, left: 80 },
    });
    layout.points.forEach((point, index) => {
      nodes.append(
        createNode(index, point, layout.width, layout.height, statuses[index]!, onStage),
      );
    });
  }
  const decor = createMoonDecor();
  root.append(
    createBackgroundStars(),
    createHeader(chapter, chapterIndex),
    constellation,
    nodes,
    createBackButton("챕터 선택으로 돌아가기", onBack, styles.back),
    decor,
  );
  return root;
}

function createFigmaLine(visual: StageSignVisual): HTMLImageElement {
  const image = document.createElement("img");
  image.className = styles.exactLine;
  image.src = visual.line.url;
  image.alt = "";
  image.style.left = `${(visual.line.x / 1920) * 100}%`;
  image.style.top = `${(visual.line.y / 1080) * 100}%`;
  image.style.width = `${(visual.line.width / 1920) * 100}%`;
  image.style.height = `${(visual.line.height / 1080) * 100}%`;
  return image;
}

function createFallbackLine(chapter: ChapterDefinition): SVGSVGElement {
  const layout = computeLayout(chapter.constellation, {
    width: 1000,
    height: 670,
    padding: { top: 50, right: 80, bottom: 50, left: 80 },
  });
  const constellation = renderConstellationSvg(layout, { lineClass: styles.line });
  constellation.setAttribute("class", styles.constellation);
  constellation.setAttribute("aria-hidden", "true");
  return constellation;
}
