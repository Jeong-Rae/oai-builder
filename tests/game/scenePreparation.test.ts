import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const mocked = vi.hoisted(() => ({
  addEventListener: vi.fn(),
  cancelAnimations: vi.fn(),
  direction: undefined as "up" | "down" | "left" | "right" | undefined,
  dispatch: vi.fn(() => ({ events: [] as Array<{ type: string; [key: string]: unknown }> })),
  mapUrl: "/stage.map" as string | undefined,
  playWormhole: vi.fn(() => Promise.resolve()),
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
    playWormhole: mocked.playWormhole,
    cancelAnimations: mocked.cancelAnimations,
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
    getState: () => ({
      game: { status: "playing" },
      eventStream: [],
      dispatch: mocked.dispatch,
      undo: vi.fn(),
      reset: vi.fn(),
    }),
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
  directionFromKey: () => mocked.direction,
  isUndoShortcut: () => false,
}));
vi.mock("@/src/game/sfx", () => ({ playSfx: vi.fn() }));

import { createGameScene } from "@/src/game/scenes/game/controller";

describe("게임 장면 사전 준비", () => {
  afterEach(() => {
    mocked.mapUrl = "/stage.map";
    mocked.direction = undefined;
    mocked.dispatch.mockReturnValue({ events: [] });
    mocked.playWormhole.mockImplementation(() => Promise.resolve());
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

  it("웜홀 연출이 끝날 때까지 추가 이동 입력을 차단한다", async () => {
    let finishWormhole!: () => void;
    mocked.direction = "right";
    mocked.dispatch.mockReturnValue({
      events: [
        {
          type: "entity/moved",
          entityId: "player",
          from: { x: 1, y: 1 },
          wormhole: { x: 2, y: 1 },
          to: { x: 6, y: 4 },
        },
      ],
    });
    mocked.playWormhole.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishWormhole = resolve;
        }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({ ok: true, text: () => Promise.resolve("map") } as Response),
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
    await scene.ready;
    const keydown = mocked.addEventListener.mock.calls.find(([type]) => type === "keydown")?.[1] as (
      event: KeyboardEvent,
    ) => void;
    const event = { key: "ArrowRight", preventDefault: vi.fn() } as unknown as KeyboardEvent;

    keydown(event);
    keydown(event);
    expect(mocked.dispatch).toHaveBeenCalledOnce();
    expect(mocked.playWormhole).toHaveBeenCalledWith(
      "player",
      { x: 2, y: 1 },
      { x: 6, y: 4 },
    );

    finishWormhole();
    await Promise.resolve();
    keydown(event);
    expect(mocked.dispatch).toHaveBeenCalledTimes(2);
    scene.dispose();
  });
});
