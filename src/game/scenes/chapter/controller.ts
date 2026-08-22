import { chapters } from "../../stages";
import { createChapterView } from "./view";

export function createChapterScene(
  initialIndex: number,
  onSelect: (index: number) => void,
): { view: HTMLElement; dispose(): void } {
  let active = initialIndex;
  let moving = false;
  let timer: number | undefined;
  const move = (offset: -1 | 1) => {
    const next = active + offset;
    if (moving || next < 0 || next >= chapters.length) return;
    moving = true;
    active = next;
    view.setActive(active);
    timer = window.setTimeout(
      () => {
        moving = false;
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420,
    );
  };
  const view = createChapterView(move, () => {
    if (!moving) onSelect(active);
  });
  const keydown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  };
  window.addEventListener("keydown", keydown);
  return {
    view: view.root,
    dispose: () => {
      window.removeEventListener("keydown", keydown);
      if (timer) window.clearTimeout(timer);
    },
  };
}
