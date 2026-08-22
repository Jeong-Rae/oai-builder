import styles from "./backgroundStars.module.css";

const assets = {
  small: new URL("@/assets/star/star_cross_s.png", import.meta.url).href,
  medium: new URL("@/assets/star/star_cross_m.png", import.meta.url).href,
  large: new URL("@/assets/star/star_cross_l.png", import.meta.url).href,
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

export function createBackgroundStars(): HTMLElement {
  const stars = document.createElement("div");
  stars.className = styles.stars;
  stars.setAttribute("aria-hidden", "true");
  positions.forEach(([x, y], index) => {
    const star = document.createElement("img");
    star.className = `${styles.star} ${index < 11 ? styles.small : index < 16 ? styles.medium : styles.large}`;
    star.src = index < 11 ? assets.small : index < 16 ? assets.medium : assets.large;
    star.alt = "";
    star.style.setProperty("--x", `${x}%`);
    star.style.setProperty("--y", `${y}%`);
    stars.append(star);
  });
  return stars;
}
