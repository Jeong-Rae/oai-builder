import { type ChapterDefinition } from "../../stages";
import { computeLayout } from "../../constellation/layout";
import { renderConstellationSvg } from "../../constellation/render";
import styles from "./scene.module.css";

const assets = {
  background: new URL("@/assets/background/background_space.png", import.meta.url).href,
  star: new URL("@/assets/star/star_plus_gold_s.png", import.meta.url).href,
  node: new URL("@/assets/star/star_stell_gold_m.png", import.meta.url).href,
};

export function createStageSelectView(
  chapter: ChapterDefinition,
  onStage: (index: number) => void,
  onBack: () => void,
): HTMLElement {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${assets.background})`;
  const header = document.createElement("h1");
  header.className = styles.header;
  header.innerHTML = `<img src="${assets.star}" alt=""><img class="${styles.zodiac}" src="${chapter.zodiacUrl}" alt="">${chapter.sign}<img src="${assets.star}" alt="">`;
  const back = document.createElement("button");
  back.type = "button";
  back.className = styles.back;
  back.textContent = "BACK";
  back.addEventListener("click", onBack);
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
  layout.points.forEach(({ x, y }, index) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = styles.node;
    node.style.setProperty("--x", `${(x / layout.width) * 100}%`);
    node.style.setProperty("--y", `${(y / layout.height) * 100}%`);
    node.setAttribute("aria-label", `${index + 1} 스테이지 시작`);
    node.innerHTML = `<img src="${assets.node}" alt=""><span>${String(index + 1).padStart(2, "0")}</span>`;
    node.addEventListener("click", () => onStage(index));
    nodes.append(node);
  });
  root.append(header, constellation, nodes, back);
  return root;
}
