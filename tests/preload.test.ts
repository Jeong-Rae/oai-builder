import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { preloadAssets } from "../src/game/preload";

describe("자산 로더", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("로딩 실패를 포함한 모든 자산의 진행률을 보고한다", async () => {
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      decode(): Promise<void> {
        return Promise.resolve();
      }

      set src(url: string) {
        queueMicrotask(() => (url === "broken.webp" ? this.onerror?.() : this.onload?.()));
      }
    }

    vi.stubGlobal("Image", FakeImage);
    const progress: Array<[number, number]> = [];

    await preloadAssets(["loaded.webp", "broken.webp"], (loaded, total) => {
      progress.push([loaded, total]);
    });

    expect(progress[0]).toEqual([0, 2]);
    expect(progress.slice(1).map(([loaded]) => loaded)).toEqual([1, 2]);
    expect(progress.at(-1)).toEqual([2, 2]);
  });
});
