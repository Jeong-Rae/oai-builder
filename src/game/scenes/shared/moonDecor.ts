import styles from "./moonDecor.module.css";

const assets = {
  moon: new URL("@/assets/moon/moon.circle.png", import.meta.url).href,
  mascot: new URL("@/assets/mascot/mascot.135deg.png", import.meta.url).href,
};

export function createMoonDecor(): HTMLElement {
  const decor = document.createElement("div");
  decor.className = styles.decor;
  const moon = document.createElement("img");
  moon.className = styles.moon;
  moon.src = assets.moon;
  moon.alt = "";
  const shadow = document.createElement("span");
  shadow.className = styles.shadow;
  const mascot = document.createElement("img");
  mascot.className = styles.mascot;
  mascot.src = assets.mascot;
  mascot.alt = "";
  decor.append(moon, shadow, mascot);
  return decor;
}
