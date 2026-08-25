import { createChapterView } from "@/src/game/scenes/chapter/view";
import { visibleChapters } from "@/src/game/stages";

export function createChapterScene(
  initialIndex: number,
  onSelect: (index: number) => void,
  onSelectChallenge: () => void,
  onBack: () => void,
): { view: HTMLElement; dispose(): void } {
  let active = initialIndex;
  let moving = false;
  let timer: number | undefined;
  const move = (offset: -1 | 1): boolean => {
    if (moving) return false;
    const next = active + offset;
    if (next < 0 || next > visibleChapters.length) return false;
    moving = true;
    active = next;
    view.setActive(active);
    timer = window.setTimeout(
      () => {
        moving = false;
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420,
    );
    return true;
  };
  const view = createChapterView(
    move,
    (selected) => {
      if (moving) return;
      if (selected === 0) onSelectChallenge();
      else onSelect(selected - 1);
    },
    onBack,
  );
  view.setActive(active);
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
