import { backgroundUrl, startAssets, tutorialAssets } from "@/src/game/assets";
import { createBackButton } from "@/src/game/components/BackButton";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import styles from "@/src/game/scenes/demo-end/scene.module.css";

const mascots = [
  startAssets.mascots[0],
  startAssets.mascots[1],
  startAssets.mascots[2],
  tutorialAssets.mascots.flag,
  tutorialAssets.mascots.lens,
] as const;

export function createDemoEndView(onBack: () => void): HTMLElement {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  root.append(createBackgroundStars());

  const message = document.createElement("div");
  message.className = styles.message;
  message.setAttribute("role", "status");
  const thanks = document.createElement("p");
  thanks.textContent = "같이 별을 찾아줘서 고마워!";
  const ending = document.createElement("p");
  ending.textContent = "데모 버전은 여기까지야! 다음에 또 같이 찾아줘";
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

  root.append(createBackButton("스테이지 선택으로 돌아가기", onBack), message, mascotLayer);
  return root;
}
