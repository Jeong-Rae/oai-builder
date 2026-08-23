import { afterEach, describe, expect, it, vi } from "vite-plus/test";

describe("게임 SFX", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("사운드를 미리 불러오고 요청할 때 처음부터 재생한다", async () => {
    const players: FakeAudio[] = [];
    class FakeAudio {
      currentTime = 1;
      preload = "";
      load = vi.fn();
      play = vi.fn(() => Promise.resolve());

      constructor(readonly src: string) {
        players.push(this);
      }
    }
    vi.stubGlobal("Audio", FakeAudio);
    const { playSfx, preloadSfx } = await import("@/src/game/sfx");

    preloadSfx();
    playSfx("move");

    expect(players).toHaveLength(4);
    expect(
      players.every((player) => player.preload === "auto" && player.load.mock.calls.length === 1),
    ).toBe(true);
    const move = players.find((player) => player.src.includes("sfx.move.mp3"));
    expect(move?.currentTime).toBe(0);
    expect(move?.play).toHaveBeenCalledOnce();
  });
});
