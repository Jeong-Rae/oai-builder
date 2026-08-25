import { backgroundUrl, startAssets, tutorialAssets } from "@/src/game/assets";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import styles from "@/src/game/scenes/demo-end/scene.module.css";

const mascots = [
  startAssets.mascots[0],
  startAssets.mascots[1],
  startAssets.mascots[2],
  tutorialAssets.mascots.flag,
  tutorialAssets.mascots.lens,
] as const;

export function createDemoEndView(): HTMLElement {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  root.append(createBackgroundStars());

  const message = document.createElement("div");
  message.className = styles.message;
  message.setAttribute("role", "status");
  const thanks = document.createElement("p");
  thanks.textContent = "플레이해주셔서 감사합니다.";
  const ending = document.createElement("p");
  ending.textContent = "데모버전은 여기까지입니다.";
  message.append(thanks, ending);

  const mascotLayer = document.createElement("div");
  mascotLayer.className = styles.mascotLayer;
  mascots.forEach((source, index) => {
    const mascot = document.createElement("img");
    mascot.className = styles.mascot;
    mascot.src = source;
    mascot.alt = "";
    mascot.style.setProperty("--mascot-index", String(index));
    mascotLayer.append(mascot);
  });

  root.append(message, mascotLayer);
  return root;
}
