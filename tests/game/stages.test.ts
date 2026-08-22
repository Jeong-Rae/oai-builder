import { describe, expect, it } from "vite-plus/test";

import {
  chapters,
  nextSelection,
  nextStage,
  stageFor,
  stageGroups,
  stagesPerGroup,
} from "../../src/game/stages";

describe("스테이지 선택", () => {
  it("각 난이도 그룹에 네 개의 스테이지를 제공한다", () => {
    expect(stageGroups).toEqual(["하", "중", "상"]);
    expect(stagesPerGroup).toBe(4);
  });

  it("마지막 스테이지 다음에는 다음 그룹의 첫 스테이지로 이동한다", () => {
    expect(nextStage({ group: 0, index: 3 })).toEqual({ group: 1, index: 0 });
  });

  it("각 별자리 챕터는 별자리 포인트 수만큼의 스테이지를 가진다", () => {
    expect(chapters).toHaveLength(12);
    expect(chapters.map((chapter) => chapter.sign)).toEqual([
      "ARIES",
      "TAURUS",
      "GEMINI",
      "CANCER",
      "LEO",
      "VIRGO",
      "LIBRA",
      "SCORPIUS",
      "SAGITTARIUS",
      "CAPRICORNUS",
      "AQUARIUS",
      "PISCES",
    ]);
    expect(
      chapters.every((chapter) => chapter.stages.length === chapter.constellation.points.length),
    ).toBe(true);
    expect(chapters[0]!.stages).toHaveLength(4);
    expect(
      new Set(chapters.flatMap((chapter) => chapter.stages.map((stage) => stage.mapUrl))).size,
    ).toBe(1);
  });

  it("챕터 마지막에서는 다음 챕터로, 전체 마지막에서는 처음으로 순환한다", () => {
    expect(nextSelection({ chapterIndex: 0, stageIndex: 3 })).toEqual({
      chapterIndex: 1,
      stageIndex: 0,
    });
    const lastChapterIndex = chapters.length - 1;
    expect(
      nextSelection({
        chapterIndex: lastChapterIndex,
        stageIndex: chapters[lastChapterIndex]!.stages.length - 1,
      }),
    ).toEqual({
      chapterIndex: 0,
      stageIndex: 0,
    });
    expect(stageFor({ chapterIndex: 2, stageIndex: 1 }).label).toBe("STAGE 2");
  });
});
