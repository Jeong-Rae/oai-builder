import { type ChapterDefinition, stageStatuses } from "../../stages";
import { computeLayout } from "../../constellation/layout";
import { renderConstellationSvg } from "../../constellation/render";
import { createMoonDecor } from "../shared/moonDecor";
import { createBackgroundStars } from "../shared/backgroundStars";
import { createSceneTitle, createTitleStar } from "../shared/title";
import styles from "./scene.module.css";
import { backgroundUrl, stageSelectAssets as assets } from "../../assets";

const nodeImageByStatus = {
  cleared: assets.clearedStarNode,
  current: assets.inProgressStarNode,
  available: assets.inProgressStarNode,
  locked: assets.lockedStarNode,
} as const;

function createHeader(chapter: ChapterDefinition, chapterIndex: number): HTMLElement {
  const header = document.createElement("header");
  header.className = "scene-header";
  const zodiac = document.createElement("img");
  zodiac.src = chapter.zodiacUrl;
  zodiac.alt = "";
  const sign = document.createElement("span");
  sign.textContent = chapter.sign;
  const titleText = document.createElement("span");
  titleText.className = styles.titleText;
  titleText.append(zodiac, sign);
  const label = document.createElement("p");
  label.className = styles.chapterLabel;
  label.textContent = `CHAPTER ${String(chapterIndex + 1).padStart(2, "0")}`;
  header.append(createSceneTitle(createTitleStar(), titleText, createTitleStar()), label);
  return header;
}

function createBackButton(onBack: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = styles.back;
  button.setAttribute("aria-label", "챕터 선택으로 돌아가기");
  button.style.backgroundImage = `url(${assets.backFrame})`;
  const icon = document.createElement("img");
  icon.src = assets.arrowBack;
  icon.alt = "";
  button.append(icon);
  button.addEventListener("click", onBack);
  return button;
}

function createNode(
  stageIndex: number,
  point: { x: number; y: number },
  layoutWidth: number,
  layoutHeight: number,
  status: ReturnType<typeof stageStatuses>[number],
  onStage: (index: number) => void,
): HTMLButtonElement {
  const node = document.createElement("button");
  node.type = "button";
  node.className = styles.node;
  node.dataset.status = status;
  node.style.setProperty("--x", `${(point.x / layoutWidth) * 100}%`);
  node.style.setProperty("--y", `${(point.y / layoutHeight) * 100}%`);
  node.disabled = status === "locked";
  const number = stageIndex + 1;
  node.setAttribute(
    "aria-label",
    status === "locked"
      ? `${number} 스테이지 잠김`
      : status === "cleared"
        ? `${number} 스테이지 다시 플레이`
        : `${number} 스테이지 시작`,
  );
  const star = document.createElement("img");
  star.className = styles.star;
  star.src = nodeImageByStatus[status];
  star.alt = "";
  node.append(star);
  if (status === "current") {
    const ring = document.createElement("span");
    ring.className = styles.ring;
    const bubble = document.createElement("span");
    bubble.className = styles.bubble;
    bubble.textContent = "NEXT";
    bubble.style.backgroundImage = `url(${assets.bubbleNext})`;
    node.append(ring, bubble);
  }
  if (status === "locked") {
    const lock = document.createElement("img");
    lock.className = styles.lock;
    lock.src = assets.lock;
    lock.alt = "";
    node.append(lock);
  }
  const label = document.createElement("span");
  label.className = styles.num;
  label.textContent = String(number).padStart(2, "0");
  node.append(label);
  if (status !== "locked") node.addEventListener("click", () => onStage(stageIndex));
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
  const layout = computeLayout(chapter.constellation, {
    width: 1000,
    height: 670,
    padding: { top: 50, right: 80, bottom: 50, left: 80 },
  });
  const constellation = renderConstellationSvg(layout, {
    lineClass: styles.line,
  });
  constellation.setAttribute("class", styles.constellation);
  constellation.setAttribute("aria-hidden", "true");
  const nodes = document.createElement("div");
  nodes.className = styles.nodes;
  const statuses = stageStatuses(chapterIndex);
  layout.points.forEach((point, index) => {
    nodes.append(createNode(index, point, layout.width, layout.height, statuses[index]!, onStage));
  });
  const decor = createMoonDecor();
  root.append(
    createBackgroundStars(),
    createHeader(chapter, chapterIndex),
    constellation,
    nodes,
    createBackButton(onBack),
    decor,
  );
  return root;
}
