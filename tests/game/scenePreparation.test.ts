import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const mocked = vi.hoisted(() => ({
  addEventListener: vi.fn(),
  mapUrl: "/stage.map" as string | undefined,
  removeEventListener: vi.fn(),
  setActionAvailability: vi.fn(),
  showError: vi.fn(),
  subscribe: vi.fn(() => vi.fn()),
  sync: vi.fn(),
}));

vi.mock("@/src/game/scenes/game/view", () => ({
  createGameView: () => ({
    root: {} as HTMLElement,
    sync: mocked.sync,
    setActionAvailability: mocked.setActionAvailability,
    setPlayerTexture: vi.fn(),
    setPlateFrame: vi.fn(),
    showError: mocked.showError,
  }),
}));
vi.mock("@/src/map/mapDocument", () => ({
  parseMap: () => ({ ok: true, map: {} }),
}));
vi.mock("@/src/game/store/gameStore", () => ({
  createGameStoreFromMap: () => ({
    getState: () => ({ game: { status: "playing" } }),
    subscribe: mocked.subscribe,
  }),
}));
vi.mock("@/src/game/stages", () => ({
  stageFor: () => ({ mapUrl: mocked.mapUrl }),
}));
vi.mock("@/src/game/features/fields/plate/presentation", () => ({
  platePressFrames: ["first", "second", "third"],
}));
vi.mock("@/src/game/features/presentation", () => ({
  playerTextureForMove: vi.fn(),
}));
vi.mock("@/src/game/input", () => ({
  directionFromKey: () => undefined,
  isUndoShortcut: () => false,
}));
vi.mock("@/src/game/sfx", () => ({ playSfx: vi.fn() }));

import { createGameScene } from "@/src/game/scenes/game/controller";

describe("게임 장면 사전 준비", () => {
  afterEach(() => {
    mocked.mapUrl = "/stage.map";
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("맵과 최초 화면이 준비된 후에만 입력을 활성화한다", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );
    vi.stubGlobal("window", {
      addEventListener: mocked.addEventListener,
      removeEventListener: mocked.removeEventListener,
      clearTimeout,
      matchMedia: () => ({ matches: false }),
      setTimeout,
    });

    const scene = createGameScene({ chapterIndex: 0, stageIndex: 0 }, vi.fn(), vi.fn());
    scene.activate();

    expect(mocked.sync).not.toHaveBeenCalled();
    expect(mocked.addEventListener).not.toHaveBeenCalled();

    resolveFetch({ ok: true, text: () => Promise.resolve("map") } as Response);
    await scene.ready;

    expect(mocked.sync).toHaveBeenCalledOnce();
    expect(mocked.subscribe).toHaveBeenCalledOnce();
    expect(mocked.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));

    scene.dispose();
    expect(mocked.removeEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("맵이 없는 스테이지도 화면에 활성화된 후에만 완료한다", async () => {
    mocked.mapUrl = undefined;
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("window", {
      addEventListener: mocked.addEventListener,
      removeEventListener: mocked.removeEventListener,
      clearTimeout,
      matchMedia: () => ({ matches: false }),
      setTimeout,
    });
    const onComplete = vi.fn();

    const scene = createGameScene({ chapterIndex: 0, stageIndex: 0 }, onComplete, vi.fn());
    await scene.ready;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onComplete).not.toHaveBeenCalled();

    scene.activate();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
