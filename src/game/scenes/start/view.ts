import { createPlateButton } from "../../components/PlateButton";
import styles from "./scene.module.css";

const assets = {
  background: new URL("@/assets/background/background_space.png", import.meta.url).href,
  lunar: new URL("@/assets/moon/moon.eclepse.trimmed.png", import.meta.url).href,
  mascots: [
    new URL("@/assets/mascot/mascot.happy.1.png", import.meta.url).href,
    new URL("@/assets/mascot/mascot.happy.2.png", import.meta.url).href,
  ],
  starSmall: new URL("@/assets/star/star_cross_s.png", import.meta.url).href,
  starMedium: new URL("@/assets/star/star_cross_m.png", import.meta.url).href,
  starLarge: new URL("@/assets/star/star_cross_l.png", import.meta.url).href,
};
const positions = [
  [85.5, 60.5],
  [41.6, 42],
  [93.6, 48.2],
  [47.5, 21.8],
  [87.5, 11.1],
  [37.2, 86],
  [53.8, 29.6],
  [20.1, 38.4],
  [16.5, 87.4],
  [4.3, 67.8],
  [90.2, 90.6],
  [69.3, 34.2],
  [61, 31],
  [34.5, 40.1],
  [72.8, 30.2],
  [90.5, 17.1],
  [5.6, 75.7],
  [42.7, 88.3],
  [13.9, 34.3],
  [68.1, 25.5],
] as const;

export function createStartView(onStart: () => void): HTMLElement {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${assets.background})`;
  const stars = document.createElement("div");
  stars.className = styles.backgroundStars;
  stars.setAttribute("aria-hidden", "true");
  positions.forEach(([x, y], index) => {
    const star = document.createElement("img");
    star.className = `${styles.backgroundStar} ${index < 11 ? styles.small : index < 16 ? styles.medium : styles.large}`;
    star.src = index < 11 ? assets.starSmall : index < 16 ? assets.starMedium : assets.starLarge;
    star.alt = "";
    star.style.setProperty("--x", `${x}%`);
    star.style.setProperty("--y", `${y}%`);
    stars.append(star);
  });
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
