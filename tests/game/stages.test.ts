import { describe, expect, it } from 'vitest';

import { nextStage, stageGroups, stagesPerGroup } from '../../src/game/stages';

describe('스테이지 선택', () => {
  it('각 난이도 그룹에 네 개의 스테이지를 제공한다', () => {
    expect(stageGroups).toEqual(['하', '중', '상']);
    expect(stagesPerGroup).toBe(4);
  });

  it('마지막 스테이지 다음에는 다음 그룹의 첫 스테이지로 이동한다', () => {
    expect(nextStage({ group: 0, index: 3 })).toEqual({ group: 1, index: 0 });
  });
});
