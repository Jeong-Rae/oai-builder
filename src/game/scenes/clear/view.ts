import { clearAssets } from "@/src/game/assets";
import { createPlateButton } from "@/src/game/components/PlateButton";
import styles from "@/src/game/scenes/clear/scene.module.css";

function createSpark(angle: number, distance: number, delay: number, size = 6): HTMLImageElement {
  const image = document.createElement("img");
  image.src = clearAssets.spark;
  image.alt = "";
  image.style.setProperty("--x", `${50 + Math.cos(angle) * distance}%`);
  image.style.setProperty("--y", `${49 + Math.sin(angle) * distance}%`);
  image.style.setProperty("--delay", `${delay}ms`);
  image.style.setProperty("--size", `${size}%`);
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
  for (let index = 0; index < 4; index += 1) {
    const angle = ((index * 90 + 45) * Math.PI) / 180;
    cluster.append(createSpark(angle, 38 + (index % 2) * 7, index * 110, 4 + (index % 3)));
  }
  cluster.append(glow, image);
  return cluster;
}

function createHeader(): HTMLElement {
  const header = document.createElement("header");
  header.className = styles.header;
  const title = document.createElement("h1");
  title.className = styles.title;
  title.textContent = "LEVEL CLEAR!";
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
  const actions = document.createElement("div");
  actions.className = styles.actions;
  [
    ["NEXT", onNext],
    ["RETRY", onRetry],
    ["HOME", onHome],
  ].forEach(([label, action], index) => {
    const button = createPlateButton(label as string, action as () => void, styles.button);
    button.style.setProperty("--button-delay", `${500 + index * 70}ms`);
    actions.append(button);
  });
  root.append(createHeader(), createStarCluster(), actions);
  return root;
}
