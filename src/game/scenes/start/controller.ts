import { createStartView } from "@/src/game/scenes/start/view";

export function createStartScene(
  onComplete: () => void,
  loaded = false,
): {
  view: HTMLElement;
  updateLoading(loaded: number, total: number): void;
  dispose(): void;
} {
  const { root, updateLoading } = createStartView(onComplete);
  updateLoading(loaded ? 1 : 0, 1);
  return { view: root, updateLoading, dispose: () => {} };
}
