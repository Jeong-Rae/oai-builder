import { describe, expect, it } from "vite-plus/test";

import {
  isInteractiveClickTarget,
  pickYellowStarIndexes,
  randomBurstTransform,
} from "@/src/game/scenes/shared/backgroundStars";

describe("빈 영역 클릭 별 효과", () => {
  it("조작 요소의 클릭만 제외한다", () => {
    expect(isInteractiveClickTarget({ closest: () => null })).toBe(false);
    expect(isInteractiveClickTarget({ closest: () => ({}) as Element })).toBe(true);
  });

  it("노란 별의 위치와 개수를 무작위로 한두 개 선택한다", () => {
    expect([...pickYellowStarIndexes(() => 0)]).toEqual([0]);
    const values = [0.4, 0.8, 0.9];
    expect([...pickYellowStarIndexes(() => values.shift()!)]).toEqual([1, 0]);
  });

  it("터지는 방향과 크기를 무작위로 바꾼다", () => {
    const values = [0.25, 0.5];
    expect(randomBurstTransform(() => values.shift()!)).toBe("rotate(90deg) scale(1)");
  });
});
