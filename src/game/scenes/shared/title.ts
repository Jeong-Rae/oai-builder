import styles from "./title.module.css";

export function createTitleStar(): HTMLSpanElement {
  const star = document.createElement("span");
  star.setAttribute("aria-hidden", "true");
  star.textContent = "★";
  return star;
}

export function createSceneTitle(
  leadingStar: HTMLElement,
  titleText: HTMLElement,
  trailingStar: HTMLElement,
): HTMLHeadingElement {
  const title = document.createElement("h1");
  title.className = styles.title;
  leadingStar.classList.add(styles.star);
  trailingStar.classList.add(styles.star);
  titleText.classList.add(styles.text);
  const content = document.createElement("span");
  content.className = styles.content;
  const divider = document.createElement("span");
  divider.className = styles.divider;
  content.append(titleText, divider);
  title.append(leadingStar, content, trailingStar);
  return title;
}
