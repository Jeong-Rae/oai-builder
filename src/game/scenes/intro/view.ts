import styles from "./scene.module.css";
import { backgroundUrl, introAssets } from "../../assets";

export function createIntroView(): { root: HTMLButtonElement; showMessage(): void } {
  const root = document.createElement("button");
  root.type = "button";
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  root.setAttribute("aria-label", "게임 시작 화면으로 이동");

  for (const variant of ["mono", "color"] as const) {
    const title = document.createElement("img");
    title.className = `${styles.title} ${styles[variant]}`;
    title.src = introAssets.title;
    title.alt = "";
    root.append(title);
  }
  const message = document.createElement("p");
  message.className = styles.message;
  message.textContent = "고양이는 세상을 구할 수 있습니다. 귀여우니까요!.";
  root.append(message);
  return { root, showMessage: () => message.classList.add(styles.messageVisible) };
}
