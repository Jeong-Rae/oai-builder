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

    await preloadAssets(
      [[() => Promise.reject(new Error("font failed")), "loaded.webp", "broken.webp"]],
      (loaded, total) => {
        progress.push([loaded, total]);
      },
    );

    expect(progress[0]).toEqual([0, 3]);
    expect(progress.slice(1).map(([loaded]) => loaded)).toEqual([1, 2, 3]);
    expect(progress.at(-1)).toEqual([3, 3]);
  });

  it("앞선 그룹을 마친 뒤 다음 그룹을 병렬로 요청한다", async () => {
    const requested: string[] = [];
    const images = new Map<string, FakeImage>();
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      decode(): Promise<void> {
        return Promise.resolve();
      }

      set src(url: string) {
        requested.push(url);
        images.set(url, this);
      }
    }

    vi.stubGlobal("Image", FakeImage);
    const loading = preloadAssets([
      ["intro-a.webp", "intro-b.webp"],
      ["intro-a.webp", "chapter-a.webp", "chapter-b.webp"],
      ["remaining.webp"],
    ]);

    expect(requested).toEqual(["intro-a.webp", "intro-b.webp"]);
    images.get("intro-a.webp")!.onload?.();
    images.get("intro-b.webp")!.onload?.();
    await vi.waitFor(() => expect(requested).toContain("chapter-a.webp"));
    expect(requested).toEqual(["intro-a.webp", "intro-b.webp", "chapter-a.webp", "chapter-b.webp"]);
    images.get("chapter-a.webp")!.onload?.();
    images.get("chapter-b.webp")!.onload?.();
    await vi.waitFor(() => expect(requested).toContain("remaining.webp"));
    images.get("remaining.webp")!.onload?.();
    await loading;
  });
});
