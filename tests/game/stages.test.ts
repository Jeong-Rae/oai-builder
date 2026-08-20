import { describe, expect, it } from 'vitest';

import { chapters, nextSelection, nextStage, stageFor, stageGroups, stagesPerGroup } from '../../src/game/stages';

describe('스테이지 선택', () => {
  it('각 난이도 그룹에 네 개의 스테이지를 제공한다', () => {
    expect(stageGroups).toEqual(['하', '중', '상']);
    expect(stagesPerGroup).toBe(4);
  });

  it('마지막 스테이지 다음에는 다음 그룹의 첫 스테이지로 이동한다', () => {
    expect(nextStage({ group: 0, index: 3 })).toEqual({ group: 1, index: 0 });
  });

  it('초기 별자리 챕터는 각각 네 개의 플레이 가능한 스테이지를 가진다', () => {
    expect(chapters).toHaveLength(12);
    expect(chapters.every((chapter) => chapter.sign === 'ARIES' && chapter.stages.length === 4)).toBe(true);
    expect(new Set(chapters.flatMap((chapter) => chapter.stages.map((stage) => stage.mapUrl))).size).toBe(1);
  });

  it('챕터 마지막에서는 다음 챕터로, 전체 마지막에서는 처음으로 순환한다', () => {
    expect(nextSelection({ chapterIndex: 0, stageIndex: 3 })).toEqual({ chapterIndex: 1, stageIndex: 0 });
    expect(nextSelection({ chapterIndex: 11, stageIndex: 3 })).toEqual({ chapterIndex: 0, stageIndex: 0 });
    expect(stageFor({ chapterIndex: 2, stageIndex: 1 }).label).toBe('STAGE 2');
  });
});
