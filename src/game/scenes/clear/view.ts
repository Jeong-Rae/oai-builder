import styles from "./scene.module.css";

const background = new URL("@/assets/background/background_space.png", import.meta.url).href;
const spark = new URL("@/assets/star/star_plus_gold_s.png", import.meta.url).href;

export function createClearView(
  onNext: () => void,
  onRetry: () => void,
  onHome: () => void,
): HTMLElement {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${background})`;
  const title = document.createElement("h1");
  title.className = styles.title;
  title.textContent = "STAGE CLEAR!";
  const celebration = document.createElement("div");
  celebration.className = styles.celebration;
  celebration.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 18; index += 1) {
    const image = document.createElement("img");
    const angle = (index * 20 * Math.PI) / 180;
    const distance = 155 + (index % 3) * 35;
    image.src = spark;
    image.alt = "";
    image.style.setProperty("--x", `${50 + (Math.cos(angle) * distance) / 19.2}%`);
    image.style.setProperty("--y", `${50 + (Math.sin(angle) * distance) / 10.8}%`);
    image.style.setProperty("--delay", `${(index % 3) * 70}ms`);
    celebration.append(image);
  }
  const actions = document.createElement("div");
  actions.className = styles.actions;
  [
    ["NEXT", onNext],
    ["RETRY", onRetry],
    ["HOME", onHome],
  ].forEach(([label, action]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label as string;
    button.addEventListener("click", action as () => void);
    actions.append(button);
  });
  root.append(title, celebration, actions);
  return root;
}
