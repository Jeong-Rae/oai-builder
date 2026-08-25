import { afterEach, describe, expect, it, vi } from "vite-plus/test";

describe("게임 BGM", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("같은 곡은 이어서 재생하고 다른 곡은 교차 페이드한다", async () => {
    const players: FakeAudio[] = [];
    const frames: FrameRequestCallback[] = [];
    let now = 1_000;
    class FakeAudio {
      private readonly listeners = new Map<string, EventListener>();
      currentTime = 12;
      loop = false;
      preload = "";
      volume = 1;
      load = vi.fn();
      pause = vi.fn();
      play = vi.fn(() => Promise.resolve());
      addEventListener = vi.fn((name: string, listener: EventListener) => {
        this.listeners.set(name, listener);
      });

      constructor(readonly src: string) {
        players.push(this);
      }

      dispatch(name: string): void {
        this.listeners.get(name)?.(new Event(name));
      }
    }
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("performance", { now: () => now });
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { preloadBgm, preloadRemainingBgm, setBgm } = await import("@/src/game/bgm");

    preloadBgm();
    expect(players).toHaveLength(1);
    const entire = players[0]!;
    expect(entire.src).toContain("bgm.entire.mp3");
    expect(entire.load).toHaveBeenCalledOnce();

    entire.dispatch("canplay");
    preloadRemainingBgm();
    setBgm("entire");
    setBgm("entire");

    expect(players).toHaveLength(4);
    expect(players.every((player) => player.loop && player.preload === "auto")).toBe(true);
    expect(players.every((player) => player.load.mock.calls.length === 1)).toBe(true);
    expect(entire.volume).toBe(0.5);
    expect(entire.currentTime).toBe(12);
    expect(entire.play).toHaveBeenCalledOnce();

    setBgm("aries");
    now += 300;
    frames.shift()?.(now);

    const aries = players.find((player) => player.src.includes("bgm.aries.mp3"))!;
    expect(entire.volume).toBe(0);
    expect(entire.pause).toHaveBeenCalledOnce();
    expect(aries.volume).toBe(0.5);
    expect(aries.play).toHaveBeenCalledOnce();
  });

  it("자동 재생 실패 후 현재 곡을 다시 재생한다", async () => {
    const play = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("blocked"))
      .mockResolvedValue(undefined);
    class FakeAudio {
      loop = false;
      preload = "";
      volume = 1;
      load = vi.fn();
      pause = vi.fn();
      play = play;
    }
    vi.stubGlobal("Audio", FakeAudio);
    const { resumeBgm, setBgm } = await import("@/src/game/bgm");

    setBgm("entire");
    await Promise.resolve();
    resumeBgm();

    expect(play).toHaveBeenCalledTimes(2);
  });

  it("전용 음원이 없는 챕터에는 기본 BGM을 사용한다", async () => {
    const { bgmForChapter } = await import("@/src/game/bgm");

    expect(bgmForChapter("ARIES")).toBe("aries");
    expect(bgmForChapter("TAURUS")).toBe("taurus");
    expect(bgmForChapter("GEMINI")).toBe("entire");
  });
});
