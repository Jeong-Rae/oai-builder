export const stageGroups = ['하', '중', '상'] as const;
export const stagesPerGroup = 4;

export interface Stage {
  group: number;
  index: number;
}

export function nextStage(stage: Stage): Stage {
  const index = stage.index + 1;
  return index < stagesPerGroup
    ? { ...stage, index }
    : { group: (stage.group + 1) % stageGroups.length, index: 0 };
}
