import { createPlateButton } from "../../components/PlateButton";
import { createBackgroundStars } from "../shared/backgroundStars";
import styles from "./scene.module.css";

const assets = {
  background: new URL("@/assets/background/background_space.png", import.meta.url).href,
  lunar: new URL("@/assets/moon/moon.eclepse.trimmed.png", import.meta.url).href,
  mascots: [
    new URL("@/assets/mascot/mascot.happy.1.png", import.meta.url).href,
    new URL("@/assets/mascot/mascot.happy.2.png", import.meta.url).href,
  ],
};

export function createStartView(onStart: () => void): HTMLElement {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${assets.background})`;
  const stars = createBackgroundStars();
  const lunar = document.createElement("img");
  lunar.className = styles.lunar;
  lunar.src = assets.lunar;
  lunar.alt = "";
  const mascot = document.createElement("img");
  mascot.className = styles.mascot;
  mascot.src = assets.mascots[Math.floor(Math.random() * assets.mascots.length)]!;
  mascot.alt = "";
  const area = document.createElement("div");
  area.className = styles.startArea;
  const start = createPlateButton("START", onStart);
  start.classList.add(styles.start);
  area.append(start);
  root.append(stars, lunar, mascot, area);
  return root;
}
