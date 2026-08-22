import { createIntroView } from "./view";

export function createIntroScene(onComplete: () => void): { view: HTMLElement; dispose(): void } {
  const { root, showMessage } = createIntroView();
  root.addEventListener("click", onComplete);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) showMessage();
  const title = root.querySelector("img:last-of-type");
  title?.addEventListener("animationend", showMessage, { once: true });
  return { view: root, dispose: () => root.removeEventListener("click", onComplete) };
}
