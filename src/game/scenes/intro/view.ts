import styles from "./scene.module.css";

const assets = {
  background: new URL("@/assets/background/background_space.png", import.meta.url).href,
  title: new URL("@/assets/title/title_point.png", import.meta.url).href,
};

export function createIntroView(): { root: HTMLButtonElement; showMessage(): void } {
  const root = document.createElement("button");
  root.type = "button";
  root.className = styles.root;
  root.style.backgroundImage = `url(${assets.background})`;
  root.setAttribute("aria-label", "게임 시작 화면으로 이동");

  for (const variant of ["mono", "color"] as const) {
    const title = document.createElement("img");
    title.className = `${styles.title} ${styles[variant]}`;
    title.src = assets.title;
    title.alt = "";
    root.append(title);
  }
  const message = document.createElement("p");
  message.className = styles.message;
  message.textContent = "고양이는 세상을 구할 수 있습니다. 귀엽기 때문이죠.";
  root.append(message);
  return { root, showMessage: () => message.classList.add(styles.messageVisible) };
}
