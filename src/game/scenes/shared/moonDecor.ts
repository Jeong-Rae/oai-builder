import styles from "./moonDecor.module.css";
import { decorAssets } from "../../assets";

export function createMoonDecor(): HTMLElement {
  const decor = document.createElement("div");
  decor.className = styles.decor;
  const moon = document.createElement("img");
  moon.className = styles.moon;
  moon.src = decorAssets.moon;
  moon.alt = "";
  const shadow = document.createElement("span");
  shadow.className = styles.shadow;
  const mascot = document.createElement("img");
  mascot.className = styles.mascot;
  mascot.src = decorAssets.mascot;
  mascot.alt = "";
  decor.append(moon, shadow, mascot);
  return decor;
}
