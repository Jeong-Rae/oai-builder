import { createStartView } from "./view";
export function createStartScene(onComplete: () => void): { view: HTMLElement; dispose(): void } {
  return { view: createStartView(onComplete), dispose: () => {} };
}
