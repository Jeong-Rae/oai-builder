import { createPlateButton } from "../../components/PlateButton";
import { backgroundUrl, startAssets } from "../../assets";
import { createBackgroundStars } from "../shared/backgroundStars";
import styles from "./scene.module.css";

export function createStartView(onStart: () => void): HTMLElement {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  const stars = createBackgroundStars();
  const lunar = document.createElement("img");
  lunar.className = styles.lunar;
  lunar.src = startAssets.lunar;
  lunar.alt = "";
  const mascot = document.createElement("img");
  mascot.className = styles.mascot;
  mascot.src = startAssets.mascots[Math.floor(Math.random() * startAssets.mascots.length)]!;
  mascot.alt = "";
  const area = document.createElement("div");
  area.className = styles.startArea;
  const start = createPlateButton("START", onStart);
  start.classList.add(styles.start);
  area.append(start);
  root.append(stars, lunar, mascot, area);
  return root;
}
