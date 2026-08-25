import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const mocked = vi.hoisted(() => ({
  addEventListener: vi.fn(),
  cancelAnimations: vi.fn(),
  controlledEntityId: "player" as "player" | "normal-1",
  direction: undefined as "up" | "down" | "left" | "right" | undefined,
  dispatch: vi.fn(() => ({ events: [] as Array<{ type: string; [key: string]: unknown }> })),
  mapUrl: "/stage.map" as string | undefined,
  mode: undefined as "stage" | "challenge" | "tutorial" | undefined,
  nextHint: {
    type: "entity",
    entityId: "normal-1",
    position: { x: 2, y: 1 },
  } as
    | { type: "entity"; entityId: string; position: { x: number; y: number } }
    | {
        type: "field";
        field: "wormhole" | "plate" | "exit";
        position: { x: number; y: number };
      }
    | undefined,
  pathDirection: "up" as "up" | "down" | "left" | "right" | undefined,
  onReset: undefined as (() => void) | undefined,
  onUndo: undefined as (() => void) | undefined,
  onHint: undefined as (() => void) | undefined,
  onSkip: undefined as (() => void) | undefined,
  playWormhole: vi.fn(() => Promise.resolve()),
  removeEventListener: vi.fn(),
  setActionAvailability: vi.fn(),
  setElapsedMs: vi.fn(),
  renderHint: vi.fn(),
  renderTutorialCue: vi.fn(),
  reset: vi.fn(),
  setPlateFrame: vi.fn(),
  showError: vi.fn(),
  subscribe: vi.fn((_listener: (state: any, previous: any) => void) => vi.fn()),
  sync: vi.fn(),
  undo: vi.fn(() => true),
}));

vi.mock("@/src/game/scenes/game/view", () => ({
  createGameView: (
    _onBack: () => void,
    onUndo: () => void,
    onReset: () => void,
    onHint: () => void,
    mode: "stage" | "challenge" | "tutorial" = "stage",
    onSkip?: () => void,
  ) => {
    mocked.onUndo = onUndo;
    mocked.onReset = onReset;
    mocked.onHint = onHint;
    mocked.onSkip = onSkip;
    mocked.mode = mode;
    return {
      root: {} as HTMLElement,
      sync: mocked.sync,
      playWormhole: mocked.playWormhole,
      cancelAnimations: mocked.cancelAnimations,
      setActionAvailability: mocked.setActionAvailability,
      setElapsedMs: mocked.setElapsedMs,
      renderHint: mocked.renderHint,
      renderTutorialCue: mocked.renderTutorialCue,
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
          player: {
            id: "player",
            kind: "player",
            position: { x: 1, y: 1 },
            controls: mocked.controlledEntityId === "player" ? ["up", "down", "left", "right"] : [],
          },
          "normal-1": {
            id: "normal-1",
            kind: "normal",
            position: { x: 2, y: 1 },
            controls: mocked.controlledEntityId === "normal-1" ? ["left"] : [],
          },
        },
      },
      eventStream: [],
      dispatch: mocked.dispatch,
      undo: mocked.undo,
      reset: mocked.reset,
    }),
    subscribe: mocked.subscribe,
  }),
}));
vi.mock("@/src/game/domain/pathfinder", () => ({
  findPath: () =>
    mocked.pathDirection ? { steps: [{ direction: mocked.pathDirection, moves: [] }] } : undefined,
  findNextHint: () =>
    mocked.nextHint ? { status: "available", target: mocked.nextHint } : { status: "unavailable" },
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

import {
  createChallengeGameScene,
  createGameScene,
  createTutorialGameScene,
} from "@/src/game/scenes/game/controller";
import type { TutorialDefinition } from "@/src/game/tutorial/rules";

describe("게임 장면 사전 준비", () => {
  afterEach(() => {
    vi.useRealTimers();
    mocked.mapUrl = "/stage.map";
    mocked.nextHint = {
      type: "entity",
      entityId: "normal-1",
      position: { x: 2, y: 1 },
    };
    mocked.direction = undefined;
    mocked.controlledEntityId = "player";
    mocked.pathDirection = "up";
    mocked.mode = undefined;
    mocked.onReset = undefined;
    mocked.onUndo = undefined;
    mocked.onHint = undefined;
    mocked.onSkip = undefined;
    mocked.dispatch.mockReturnValue({ events: [] });
    mocked.playWormhole.mockImplementation(() => Promise.resolve());
    mocked.undo.mockReturnValue(true);
    vi.clearAllMocks();
    mocked.subscribe.mockImplementation((_listener) => vi.fn());
    vi.unstubAllGlobals();
  });

  it("튜토리얼 전용 맵과 최초 안내를 준비한다", async () => {
    const fetch = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve("map") } as Response),
    );
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("window", {
      addEventListener: mocked.addEventListener,
      removeEventListener: mocked.removeEventListener,
      clearTimeout,
      matchMedia: () => ({ matches: false }),
      setTimeout,
    });
    const definition: TutorialDefinition = {
      id: "tutorial-test",
      mapUrl: "/tutorial.map",
      initialCue: {
        id: "start",
        mascot: "happy",
        lines: [[{ text: "움직여보자!" }]],
      },
      rules: [],
    };

    const onSkip = vi.fn();
    const scene = createTutorialGameScene(definition, vi.fn(), vi.fn(), onSkip);
    await scene.ready;

    expect(mocked.mode).toBe("tutorial");
    expect(mocked.onSkip).toBe(onSkip);
    expect(mocked.renderTutorialCue).toHaveBeenCalledWith(definition.initialCue);
    expect(fetch).toHaveBeenCalledWith(
      "/tutorial.map",
      expect.objectContaining({ signal: expect.anything() }),
    );
    scene.dispose();
  });

  it("최초 안내를 2초간 표시한 뒤 현재 경로의 다음 키를 계속 안내한다", async () => {
    vi.useFakeTimers();
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
    const definition: TutorialDefinition = {
      id: "tutorial-path",
      mapUrl: "/tutorial.map",
      initialCue: {
        id: "start",
        mascot: "flag",
        lines: [[{ text: "별을 되찾아 주세요!" }]],
      },
      pathGuidance: { afterInitialMs: 2_000, mascot: "flag" },
      rules: [],
    };

    const scene = createTutorialGameScene(definition, vi.fn(), vi.fn());
    await scene.ready;
    scene.activate();

    vi.advanceTimersByTime(1_999);
    expect(mocked.renderTutorialCue).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(mocked.renderTutorialCue).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "path-up", keyHint: "up", mascot: "flag" }),
    );

    mocked.pathDirection = "right";
    listener(
      { game: { status: "playing", plateStates: {} }, eventStream: [] },
      { game: { status: "playing", plateStates: {} }, eventStream: [] },
    );
    expect(mocked.renderTutorialCue).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "path-right", keyHint: "right", mascot: "flag" }),
    );
    scene.dispose();
  });

  it("종료 조건을 만족하면 경로 안내를 멈추고 이벤트 안내를 유지한다", async () => {
    vi.useFakeTimers();
    let listener!: (state: any, previous: any) => void;
    mocked.subscribe.mockImplementationOnce((entry) => {
      listener = entry;
      return vi.fn();
    });
    mocked.controlledEntityId = "player";
    mocked.direction = "left";
    mocked.pathDirection = "left";
    mocked.dispatch.mockReturnValue({
      events: [
        {
          type: "entity/moved",
          entityId: "player",
          from: { x: 1, y: 1 },
          wormhole: { x: 0, y: 1 },
          to: { x: 2, y: 1 },
        },
      ],
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
    const eventCue = { id: "wormhole", mascot: "lens" as const, lines: [[{ text: "도착!" }]] };
    const definition: TutorialDefinition = {
      id: "tutorial-path-until",
      mapUrl: "/tutorial.map",
      initialCue: { id: "start", mascot: "lens", lines: [[{ text: "포탈로 가자!" }]] },
      pathGuidance: {
        afterInitialMs: 2_000,
        mascot: "flag",
        until: [{ type: "wormhole" }],
      },
      rules: [{ id: "wormhole", when: [{ type: "wormhole" }], cue: eventCue }],
    };
    const scene = createTutorialGameScene(definition, vi.fn(), vi.fn());
    await scene.ready;
    scene.activate();
    vi.advanceTimersByTime(2_000);

    const keydown = mocked.addEventListener.mock.calls.find(
      ([type]) => type === "keydown",
    )?.[1] as (event: KeyboardEvent) => void;
    keydown({ key: "ArrowLeft", preventDefault: vi.fn() } as unknown as KeyboardEvent);
    expect(mocked.renderTutorialCue).toHaveBeenLastCalledWith(eventCue);

    mocked.pathDirection = "right";
    listener(
      { game: { status: "playing", plateStates: {} }, eventStream: [] },
      { game: { status: "playing", plateStates: {} }, eventStream: [] },
    );
    expect(mocked.renderTutorialCue).toHaveBeenLastCalledWith(eventCue);
    scene.dispose();
  });

  it("튜토리얼 완료 조건을 만족하면 goal 도달 없이 완료한다", async () => {
    vi.useFakeTimers();
    mocked.controlledEntityId = "normal-1";
    mocked.direction = "left";
    mocked.dispatch.mockReturnValue({
      events: [
        {
          type: "entity/moved",
          entityId: "normal-1",
          from: { x: 2, y: 1 },
          to: { x: 1, y: 1 },
        },
      ],
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
    const onComplete = vi.fn();
    const definition: TutorialDefinition = {
      completion: {
        when: [
          { type: "direction", direction: "left" },
          { type: "outcome", outcome: "moved" },
          { type: "event", event: "entity/moved" },
          { type: "object", entity: { role: "actor", id: "normal-1" } },
        ],
      },
      id: "tutorial-completion",
      mapUrl: "/tutorial.map",
      initialCue: { id: "start", mascot: "lens", lines: [[{ text: "왼쪽으로 이동해봐!" }]] },
      rules: [],
    };
    const scene = createTutorialGameScene(definition, onComplete, vi.fn());
    await scene.ready;
    scene.activate();
    const keydown = mocked.addEventListener.mock.calls.find(
      ([type]) => type === "keydown",
    )?.[1] as (event: KeyboardEvent) => void;
    const event = { key: "ArrowLeft", preventDefault: vi.fn() } as unknown as KeyboardEvent;

    keydown(event);
    keydown(event);
    expect(mocked.dispatch).toHaveBeenCalledOnce();
    expect(mocked.setActionAvailability).toHaveBeenLastCalledWith(false, false);
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(700);
    expect(onComplete).toHaveBeenCalledOnce();
    scene.dispose();
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
    expect(mocked.renderHint).toHaveBeenCalledWith({
      status: "targeted",
      target: mocked.nextHint,
    });

    const keydown = mocked.addEventListener.mock.calls.find(
      ([type]) => type === "keydown",
    )?.[1] as (event: KeyboardEvent) => void;
    const event = { key: "ArrowRight", preventDefault: vi.fn() } as unknown as KeyboardEvent;
    mocked.renderHint.mockClear();

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
    expect(mocked.renderHint).not.toHaveBeenCalled();

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
    expect(mocked.renderHint).toHaveBeenCalledWith({ status: "idle" });
    scene.dispose();
  });

  it.each([
    [
      "웜홀",
      { type: "field", field: "wormhole", position: { x: 2, y: 1 } },
      {
        type: "entity/moved",
        entityId: "player",
        wormhole: { x: 2, y: 1 },
        to: { x: 4, y: 1 },
      },
    ],
    [
      "플레이트",
      { type: "field", field: "plate", position: { x: 2, y: 1 } },
      { type: "plate/activated", position: { x: 2, y: 1 } },
    ],
    [
      "출구",
      { type: "field", field: "exit", position: { x: 2, y: 1 } },
      { type: "game/completed" },
    ],
  ] as const)("%s 힌트는 대상 이벤트가 발생하면 제거한다", async (_name, target, hintEvent) => {
    mocked.direction = "right";
    mocked.nextHint = target;
    mocked.dispatch.mockReturnValue({ events: [hintEvent] });
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
    mocked.renderHint.mockClear();

    const keydown = mocked.addEventListener.mock.calls.find(
      ([type]) => type === "keydown",
    )?.[1] as (event: KeyboardEvent) => void;
    keydown({ key: "ArrowRight", preventDefault: vi.fn() } as unknown as KeyboardEvent);

    expect(mocked.renderHint).toHaveBeenCalledWith({ status: "idle" });
    scene.dispose();
  });

  it("초기화와 성공한 되돌리기는 힌트 상태를 함께 초기화한다", async () => {
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

    mocked.onHint?.();
    mocked.renderHint.mockClear();
    mocked.onReset?.();
    expect(mocked.reset).toHaveBeenCalledOnce();
    expect(mocked.renderHint).toHaveBeenLastCalledWith({ status: "idle" });

    mocked.onHint?.();
    mocked.renderHint.mockClear();
    mocked.undo.mockReturnValueOnce(false);
    mocked.onUndo?.();
    expect(mocked.renderHint).not.toHaveBeenCalled();

    mocked.undo.mockReturnValueOnce(true);
    mocked.onUndo?.();
    expect(mocked.renderHint).toHaveBeenLastCalledWith({ status: "idle" });
    scene.dispose();
  });

  it("풀이 경로가 없으면 힌트 버튼의 경고 상태를 매번 다시 요청한다", async () => {
    mocked.nextHint = undefined;
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
    mocked.onHint?.();
    mocked.onHint?.();

    expect(mocked.renderHint).toHaveBeenCalledTimes(2);
    expect(mocked.renderHint).toHaveBeenLastCalledWith({ status: "unavailable" });
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
