import { createDemoEndView } from "@/src/game/scenes/demo-end/view";

export function createDemoEndScene(onBack: () => void): {
  view: HTMLElement;
  ready: Promise<void>;
  activate(): void;
  dispose(): void;
} {
  return {
    view: createDemoEndView(onBack),
    ready: Promise.resolve(),
    activate() {},
    dispose() {},
  };
}
