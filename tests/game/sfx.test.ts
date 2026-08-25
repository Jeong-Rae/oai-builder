import { afterEach, describe, expect, it, vi } from "vite-plus/test";

describe("게임 SFX", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("사운드를 디코딩하고 같은 효과음을 다시 요청할 때 새 노드로 교체한다", async () => {
    const sources: FakeSource[] = [];
    const gains: FakeGain[] = [];
    class FakeSource {
      buffer?: AudioBuffer;
      connect = vi.fn();
      start = vi.fn();
      stop = vi.fn();
      addEventListener = vi.fn();
    }
    class FakeGain {
      gain = { value: 1 };
      connect = vi.fn();
    }

    const decodedBuffer = {} as AudioBuffer;
    let audio: FakeAudioContext | undefined;
    class FakeAudioContext {
      state: AudioContextState = "suspended";
      destination = {} as AudioDestinationNode;
      decodeAudioData = vi.fn(() => Promise.resolve(decodedBuffer));
      resume = vi.fn(async () => {
        this.state = "running";
      });
      createBufferSource = vi.fn(() => {
        const source = new FakeSource();
        sources.push(source);
        return source;
      });
      createGain = vi.fn(() => {
        const gain = new FakeGain();
        gains.push(gain);
        return gain;
      });

      constructor() {
        audio = this;
      }
    }

    const fetch = vi.fn((_url: string) =>
      Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }),
    );
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal("fetch", fetch);
    const { playSfx, preloadSfx } = await import("@/src/game/sfx");

    preloadSfx();
    await vi.waitFor(() => expect(audio?.decodeAudioData).toHaveBeenCalledTimes(6));
    playSfx("typing");
    await vi.waitFor(() => expect(sources).toHaveLength(1));
    playSfx("typing");
    await vi.waitFor(() => expect(sources).toHaveLength(2));
    playSfx("move");
    await vi.waitFor(() => expect(sources).toHaveLength(3));

    expect(fetch).toHaveBeenCalledTimes(6);
    expect(fetch.mock.calls.some(([url]) => String(url).includes("sfx.swoosh.mp3"))).toBe(true);
    expect(audio?.resume).toHaveBeenCalledOnce();
    expect(sources[0]?.stop).toHaveBeenCalledOnce();
    expect(sources[0]?.start).toHaveBeenCalledOnce();
    expect(sources[1]?.buffer).toBe(decodedBuffer);
    expect(gains[1]?.gain.value).toBe(0.5);
    expect(gains[2]?.gain.value).toBe(0.7);
    expect(sources[1]?.connect).toHaveBeenCalledWith(gains[1]);
    expect(gains[1]?.connect).toHaveBeenCalledWith(audio?.destination);
    expect(sources[1]?.start).toHaveBeenCalledOnce();
  });
});
