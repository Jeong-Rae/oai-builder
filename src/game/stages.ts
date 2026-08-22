import type { ConstellationDefinition } from "./constellation/model";
import { parseConstellation } from "./constellation/parse";
import ariesConstellationData from "./data/constellations/aries.json";
import {
  deriveStageStatuses,
  prerequisiteIndices,
  progressStore,
  type StageStatus,
} from "./store/progressStore";

export const stageGroups = ["하", "중", "상"] as const;
export const stagesPerGroup = 4;

export interface Stage {
  group: number;
  index: number;
}

export interface StageDefinition {
  id: string;
  label: string;
  mapUrl: string;
}

export interface ChapterDefinition {
  id: string;
  sign: "ARIES";
  zodiacUrl: string;
  constellation: ConstellationDefinition;
  stages: readonly StageDefinition[];
}

export interface PlaySelection {
  chapterIndex: number;
  stageIndex: number;
}

const map001 = new URL("@/maps/001.map", import.meta.url).href;
const ariesZodiac = new URL("@/assets/zodiac/zodiac_aries_active.png", import.meta.url).href;
const ariesConstellation = parseConstellation(ariesConstellationData);

export const chapters: readonly ChapterDefinition[] = Array.from(
  { length: 12 },
  (_, chapterIndex) => ({
    id: `chapter-${chapterIndex + 1}`,
    sign: "ARIES",
    zodiacUrl: ariesZodiac,
    constellation: ariesConstellation,
    stages: Array.from({ length: ariesConstellation.points.length }, (_, stageIndex) => ({
      id: `chapter-${chapterIndex + 1}-stage-${stageIndex + 1}`,
      label: `STAGE ${stageIndex + 1}`,
      mapUrl: map001,
    })),
  }),
);

export function stageStatuses(chapterIndex: number): StageStatus[] {
  const chapter = chapters[chapterIndex]!;
  return deriveStageStatuses(
    chapter.stages.length,
    prerequisiteIndices(chapter.constellation),
    progressStore.clearedStages(chapterIndex, chapter.stages.length),
  );
}

export function stageFor({ chapterIndex, stageIndex }: PlaySelection): StageDefinition {
  return chapters[chapterIndex]!.stages[stageIndex]!;
}

export function nextSelection({ chapterIndex, stageIndex }: PlaySelection): PlaySelection {
  if (stageIndex + 1 < chapters[chapterIndex]!.stages.length) {
    return { chapterIndex, stageIndex: stageIndex + 1 };
  }

  return { chapterIndex: (chapterIndex + 1) % chapters.length, stageIndex: 0 };
}

export function nextStage(stage: Stage): Stage {
  const index = stage.index + 1;
  return index < stagesPerGroup
    ? { ...stage, index }
    : { group: (stage.group + 1) % stageGroups.length, index: 0 };
}
