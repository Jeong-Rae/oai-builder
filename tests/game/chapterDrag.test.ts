import { describe, expect, it } from "vite-plus/test";

import { chapterMoveFromDrag } from "@/src/game/scenes/chapter/view";

describe("챕터 선택 드래그", () => {
  it("카드 간격의 절반을 넘긴 방향으로 한 칸 이동한다", () => {
    expect(chapterMoveFromDrag(132, 1000)).toBe(0);
    expect(chapterMoveFromDrag(134, 1000)).toBe(-1);
    expect(chapterMoveFromDrag(-134, 1000)).toBe(1);
  });
});
