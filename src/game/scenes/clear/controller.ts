import { createClearView } from "./view";
export function createClearScene(
  onNext: () => void,
  onRetry: () => void,
  onHome: () => void,
): { view: HTMLElement; dispose(): void } {
  const keydown = (event: KeyboardEvent) => {
    if (event.key === "Enter") onNext();
    if (event.key.toLowerCase() === "r") onRetry();
    if (event.key.toLowerCase() === "h" || event.key === "Escape") onHome();
  };
  window.addEventListener("keydown", keydown);
  return {
    view: createClearView(onNext, onRetry, onHome),
    dispose: () => window.removeEventListener("keydown", keydown),
  };
}
