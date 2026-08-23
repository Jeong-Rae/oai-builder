import { titleAssets } from "@/src/game/assets";
import styles from "@/src/game/scenes/shared/title.module.css";

export function createTitleStar(): HTMLImageElement {
  const star = document.createElement("img");
  star.setAttribute("aria-hidden", "true");
  star.src = titleAssets.starCross;
  star.alt = "";
  return star;
}

export function createSceneTitle(
  variant: "chapter" | "stage",
  leadingStar: HTMLElement,
  titleText: HTMLElement,
  trailingStar: HTMLElement,
  dividerCenter?: HTMLElement,
): HTMLHeadingElement {
  const title = document.createElement("h1");
  title.className = `${styles.title} ${styles[variant]}`;
  leadingStar.classList.add(styles.star);
  trailingStar.classList.add(styles.star);
  titleText.classList.add(styles.text);
  const divider = document.createElement("span");
  divider.className = styles.divider;
  divider.setAttribute("aria-hidden", "true");
  title.append(leadingStar, titleText, trailingStar, divider);
  if (dividerCenter) {
    dividerCenter.classList.add(styles.dividerCenter);
    title.append(dividerCenter);
  }
  return title;
}
