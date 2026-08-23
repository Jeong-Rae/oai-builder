import { describe, expect, it } from "vite-plus/test";

import { isInteractiveClickTarget } from "@/src/game/scenes/shared/backgroundStars";

describe("빈 영역 클릭 별 효과", () => {
  it("조작 요소의 클릭만 제외한다", () => {
    expect(isInteractiveClickTarget({ closest: () => null })).toBe(false);
    expect(isInteractiveClickTarget({ closest: () => ({}) as Element })).toBe(true);
  });
});
