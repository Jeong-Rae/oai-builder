import { describe, expect, it } from "vite-plus/test";

import { validateAssetName } from "../scripts/validate-asset-names.mjs";

describe("에셋 네이밍", () => {
  it("정상 이름을 허용한다", () => {
    expect(validateAssetName("box.normal.color-blue.webp")).toEqual([]);
    expect(validateAssetName("goal.frame-01.size-96x96.webp")).toEqual([]);
    expect(validateAssetName("star.cross.large.webp")).toEqual([]);
  });

  it.each([
    "Moon.webp",
    "player_default.webp",
    "tile.origin.webp",
    "goal.1.webp",
    "goal.frame-1.webp",
    "tile.size-0x96.webp",
    "arrow.direction.webp",
    "box.normal.png",
  ])("잘못된 이름 %s을 거부한다", (fileName) => {
    expect(validateAssetName(fileName)).not.toEqual([]);
  });
});
