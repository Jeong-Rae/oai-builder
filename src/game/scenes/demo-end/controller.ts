import { createDemoEndView } from "@/src/game/scenes/demo-end/view";

export function createDemoEndScene(): {
  view: HTMLElement;
  ready: Promise<void>;
  activate(): void;
  dispose(): void;
} {
  return {
    view: createDemoEndView(),
    ready: Promise.resolve(),
    activate() {},
    dispose() {},
  };
}
