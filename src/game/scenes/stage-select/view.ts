import { type ChapterDefinition } from "../../stages";
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
  const constellation = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  constellation.setAttribute("class", styles.constellation);
  constellation.setAttribute("viewBox", "0 0 1000 670");
  constellation.setAttribute("aria-hidden", "true");
  const source = chapter.constellation;
  const minX = Math.min(...source.map(({ x }) => x));
  const maxX = Math.max(...source.map(({ x }) => x));
  const minY = Math.min(...source.map(({ y }) => y));
  const maxY = Math.max(...source.map(({ y }) => y));
  const points = source.map(({ x, y }) => ({
    x: 80 + (840 * (x - minX)) / (maxX - minX),
    y: 50 + (570 * (y - minY)) / (maxY - minY),
  }));
  constellation.innerHTML = `<polyline class="${styles.line}" points="${points.map(({ x, y }) => `${x},${y}`).join(" ")}"/>`;
  const nodes = document.createElement("div");
  nodes.className = styles.nodes;
  points.forEach(({ x, y }, index) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = styles.node;
    node.style.setProperty("--x", `${x / 10}%`);
    node.style.setProperty("--y", `${y / 6.7}%`);
    node.setAttribute("aria-label", `${index + 1} 스테이지 시작`);
    node.innerHTML = `<img src="${assets.node}" alt=""><span>${String(index + 1).padStart(2, "0")}</span>`;
    node.addEventListener("click", () => onStage(index));
    nodes.append(node);
  });
  root.append(header, constellation, nodes, back);
  return root;
}
