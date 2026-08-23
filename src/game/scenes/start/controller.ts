import { createStartView } from "@/src/game/scenes/start/view";

export interface StartScene {
  view: HTMLElement;
  updateLoading(loaded: number, total: number): void;
  setAuthenticated(authenticated: boolean): void;
  setPending(pending: boolean): void;
  setError(message?: string): void;
  dispose(): void;
}

export function createStartScene(
  onComplete: () => void,
  loaded = false,
  authenticated = false,
): StartScene {
  const { root, updateLoading, setAuthenticated, setPending, setError } = createStartView(
    onComplete,
    authenticated,
  );
  updateLoading(loaded ? 1 : 0, 1);
  return {
    view: root,
    updateLoading,
    setAuthenticated,
    setPending,
    setError,
    dispose: () => {},
  };
}
