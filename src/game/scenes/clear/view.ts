import styles from "./scene.module.css";
import { backgroundUrl, clearAssets, plateButtonUrl } from "../../assets";

function createSpark(angle: number, distance: number, delay: number): HTMLImageElement {
  const image = document.createElement("img");
  image.src = clearAssets.spark;
  image.alt = "";
  image.style.setProperty("--x", `${50 + Math.cos(angle) * distance}%`);
  image.style.setProperty("--y", `${49 + Math.sin(angle) * distance}%`);
  image.style.setProperty("--delay", `${delay}ms`);
  return image;
}

function createStarCluster(): HTMLElement {
  const cluster = document.createElement("div");
  cluster.className = styles.cluster;
  const glow = document.createElement("span");
  glow.className = styles.glow;
  glow.setAttribute("aria-hidden", "true");
  const image = document.createElement("img");
  image.className = styles.star;
  image.src = clearAssets.star;
  image.alt = "";
  for (let index = 0; index < 10; index += 1) {
    const angle = (index * 36 * Math.PI) / 180;
    cluster.append(createSpark(angle, 15.5 + (index % 3) * 3.5, (index % 3) * 90));
  }
  cluster.append(glow, image);
  return cluster;
}

function createHeader(): HTMLElement {
  const header = document.createElement("header");
  header.className = styles.header;
  const title = document.createElement("h1");
  title.className = styles.title;
  title.textContent = "STAGE CLEAR!";
  const leadingSpark = createSpark(0, 0, 0);
  const trailingSpark = createSpark(0, 0, 120);
  leadingSpark.className = styles.titleSpark;
  trailingSpark.className = styles.titleSpark;
  header.append(leadingSpark, title, trailingSpark);
  return header;
}

export function createClearView(
  onNext: () => void,
  onRetry: () => void,
  onHome: () => void,
): HTMLElement {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  const actions = document.createElement("div");
  actions.className = styles.actions;
  [
    ["NEXT", onNext],
    ["RETRY", onRetry],
    ["HOME", onHome],
  ].forEach(([label, action]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = styles.button;
    button.style.backgroundImage = `url(${plateButtonUrl})`;
    button.textContent = label as string;
    button.addEventListener("click", action as () => void);
    actions.append(button);
  });
  root.append(createHeader(), createStarCluster(), actions);
  return root;
}
