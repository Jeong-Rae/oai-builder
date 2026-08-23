import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const mocked = vi.hoisted(() => ({
  addEventListener: vi.fn(),
  cancelAnimations: vi.fn(),
  direction: undefined as "up" | "down" | "left" | "right" | undefined,
  dispatch: vi.fn(() => ({ events: [] as Array<{ type: string; [key: string]: unknown }> })),
  mapUrl: "/stage.map" as string | undefined,
  onHint: undefined as (() => void) | undefined,
  playWormhole: vi.fn(() => Promise.resolve()),
  removeEventListener: vi.fn(),
  setActionAvailability: vi.fn(),
  setElapsedMs: vi.fn(),
  setHintPosition: vi.fn(),
  setPlateFrame: vi.fn(),
  showError: vi.fn(),
  subscribe: vi.fn((_listener: (state: any, previous: any) => void) => vi.fn()),
  sync: vi.fn(),
}));

vi.mock("@/src/game/scenes/game/view", () => ({
  createGameView: (
    _onBack: () => void,
    _onUndo: () => void,
    _onReset: () => void,
    onHint: () => void,
  ) => {
    mocked.onHint = onHint;
    return {
      root: {} as HTMLElement,
      sync: mocked.sync,
      playWormhole: mocked.playWormhole,
      cancelAnimations: mocked.cancelAnimations,
      setActionAvailability: mocked.setActionAvailability,
      setElapsedMs: mocked.setElapsedMs,
      setHintPosition: mocked.setHintPosition,
      setPlayerTexture: vi.fn(),
      setPlateFrame: mocked.setPlateFrame,
      showError: mocked.showError,
    };
  },
}));
vi.mock("@/src/map/mapDocument", () => ({
  parseMap: () => ({ ok: true, map: {} }),
}));
vi.mock("@/src/game/store/gameStore", () => ({
  createGameStoreFromMap: () => ({
    getState: () => ({
      game: {
        status: "playing",
        entities: {
          player: { id: "player", position: { x: 1, y: 1 } },
          "normal-1": { id: "normal-1", position: { x: 2, y: 1 } },
        },
      },
      eventStream: [],
      dispatch: mocked.dispatch,
      undo: vi.fn(),
      reset: vi.fn(),
    }),
    subscribe: mocked.subscribe,
  }),
}));
vi.mock("@/src/game/domain/pathfinder", () => ({
  findNextInteraction: () => ({ x: 2, y: 1 }),
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

import { createChallengeGameScene, createGameScene } from "@/src/game/scenes/game/controller";

describe("게임 장면 사전 준비", () => {
  afterEach(() => {
    mocked.mapUrl = "/stage.map";
    mocked.direction = undefined;
    mocked.onHint = undefined;
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
    expect(mocked.setActionAvailability).toHaveBeenCalledWith(false, true);
    expect(mocked.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));

    scene.dispose();
    expect(mocked.removeEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("플레이트가 활성화되면 높은 프레임부터 누름 연출을 시작한다", async () => {
    let listener!: (state: any, previous: any) => void;
    mocked.subscribe.mockImplementationOnce((entry) => {
      listener = entry;
      return vi.fn();
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve("map") } as Response)),
    );
    vi.stubGlobal("window", {
      addEventListener: mocked.addEventListener,
      removeEventListener: mocked.removeEventListener,
      clearTimeout,
      matchMedia: () => ({ matches: false }),
      setTimeout,
    });
    const scene = createGameScene({ chapterIndex: 0, stageIndex: 0 }, vi.fn(), vi.fn());
    await scene.ready;

    listener(
      { game: { status: "playing", plateStates: { "2,1": "active" } }, eventStream: [] },
      { game: { status: "playing", plateStates: { "2,1": "inactive" } }, eventStream: [] },
    );

    expect(mocked.setPlateFrame).toHaveBeenCalledWith({ x: 2, y: 1 }, "first");
    scene.dispose();
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
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve("map") } as Response)),
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
    const keydown = mocked.addEventListener.mock.calls.find(
      ([type]) => type === "keydown",
    )?.[1] as (event: KeyboardEvent) => void;
    const event = { key: "ArrowRight", preventDefault: vi.fn() } as unknown as KeyboardEvent;

    mocked.setActionAvailability.mockClear();
    keydown(event);
    keydown(event);
    expect(mocked.dispatch).toHaveBeenCalledOnce();
    expect(mocked.setActionAvailability).not.toHaveBeenCalled();
    expect(mocked.playWormhole).toHaveBeenCalledWith("player", { x: 2, y: 1 }, { x: 6, y: 4 });

    finishWormhole();
    await Promise.resolve();
    keydown(event);
    expect(mocked.dispatch).toHaveBeenCalledTimes(2);
    scene.dispose();
  });

  it("힌트 대상과 상호작용할 때만 힌트 서클을 제거한다", async () => {
    mocked.direction = "right";
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve("map") } as Response)),
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
    mocked.onHint?.();
    expect(mocked.setHintPosition).toHaveBeenCalledWith({ x: 2, y: 1 });

    const keydown = mocked.addEventListener.mock.calls.find(
      ([type]) => type === "keydown",
    )?.[1] as (event: KeyboardEvent) => void;
    const event = { key: "ArrowRight", preventDefault: vi.fn() } as unknown as KeyboardEvent;
    mocked.setHintPosition.mockClear();

    mocked.dispatch.mockReturnValueOnce({
      events: [{ type: "entity/moved", entityId: "player" }],
    });
    keydown(event);
    mocked.dispatch.mockReturnValueOnce({
      events: [
        {
          type: "control/transferred",
          fromEntityId: "player",
          toEntityId: "normal-2",
        },
      ],
    });
    keydown(event);
    expect(mocked.setHintPosition).not.toHaveBeenCalled();

    mocked.dispatch.mockReturnValueOnce({
      events: [
        {
          type: "control/transferred",
          fromEntityId: "player",
          toEntityId: "normal-1",
        },
      ],
    });
    keydown(event);
    expect(mocked.setHintPosition).toHaveBeenCalledWith();
    scene.dispose();
  });

  it("클리어하면 버튼 그룹을 비활성화한다", async () => {
    mocked.subscribe.mockImplementation((listener) => {
      listener(
        { game: { status: "completed", plateStates: {} }, eventStream: [] },
        { game: { status: "playing", plateStates: {} }, eventStream: [] },
      );
      return vi.fn();
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve("map") } as Response)),
    );
    vi.stubGlobal("window", {
      addEventListener: mocked.addEventListener,
      removeEventListener: mocked.removeEventListener,
      clearTimeout,
      matchMedia: () => ({ matches: false }),
      setTimeout,
    });

    const scene = createGameScene({ chapterIndex: 0, stageIndex: 0 }, vi.fn(), vi.fn());
    await scene.ready;

    expect(mocked.setActionAvailability).toHaveBeenLastCalledWith(false, false);
    scene.dispose();
  });

  it("챌린지 입력이 준비되면 시간을 재고 완료 순간의 기록을 전달한다", async () => {
    const now = vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(350);
    vi.stubGlobal("performance", { now });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve("map") } as Response)),
    );
    vi.stubGlobal("window", {
      addEventListener: mocked.addEventListener,
      removeEventListener: mocked.removeEventListener,
      cancelAnimationFrame: vi.fn(),
      clearTimeout,
      matchMedia: () => ({ matches: true }),
      requestAnimationFrame: vi.fn(() => 1),
      setTimeout,
    });
    const onComplete = vi.fn();
    const scene = createChallengeGameScene("/challenge.map", onComplete, vi.fn());

    scene.activate();
    await scene.ready;
    expect(mocked.setElapsedMs).toHaveBeenCalledWith(0);

    const listener = mocked.subscribe.mock.calls.at(-1)?.[0] as (
      state: { game: { status: string; eventStream: never[]; plateStates: object } },
      previous: { game: { status: string; eventStream: never[]; plateStates: object } },
    ) => void;
    listener(
      { game: { status: "completed", eventStream: [], plateStates: {} } },
      { game: { status: "playing", eventStream: [], plateStates: {} } },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onComplete).toHaveBeenCalledWith(250);
    scene.dispose();
  });
});
