import { chapters } from "../../stages";
import { createStageSelectView } from "./view";

export function createStageSelectScene(
  chapterIndex: number,
  onStage: (stageIndex: number) => void,
  onBack: () => void,
): { view: HTMLElement; dispose(): void } {
  const keydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" || event.key === "Backspace") {
      event.preventDefault();
      onBack();
    }
  };
  window.addEventListener("keydown", keydown);
  return {
    view: createStageSelectView(chapters[chapterIndex]!, chapterIndex, onStage, onBack),
    dispose: () => window.removeEventListener("keydown", keydown),
  };
}
