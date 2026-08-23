import type { ConstellationDefinition } from "@/src/game/constellation/model";
import { parseConstellation } from "@/src/game/constellation/parse";
import aquariusConstellationData from "@/src/game/data/constellations/aquarius.json";
import ariesConstellationData from "@/src/game/data/constellations/aries.json";
import cancerConstellationData from "@/src/game/data/constellations/cancer.json";
import capricornusConstellationData from "@/src/game/data/constellations/capricornus.json";
import geminiConstellationData from "@/src/game/data/constellations/gemini.json";
import leoConstellationData from "@/src/game/data/constellations/leo.json";
import libraConstellationData from "@/src/game/data/constellations/libra.json";
import piscesConstellationData from "@/src/game/data/constellations/pisces.json";
import sagittariusConstellationData from "@/src/game/data/constellations/sagittarius.json";
import scorpiusConstellationData from "@/src/game/data/constellations/scorpius.json";
import taurusConstellationData from "@/src/game/data/constellations/taurus.json";
import virgoConstellationData from "@/src/game/data/constellations/virgo.json";
import {
  deriveStageStatuses,
  prerequisiteIndices,
  progressStore,
  type StageStatus,
} from "@/src/game/store/progressStore";

export const stageGroups = ["하", "중", "상"] as const;
export const stagesPerGroup = 4;

export interface Stage {
  group: number;
  index: number;
}

export interface StageDefinition {
  id: string;
  label: string;
  mapUrl?: string;
}

export interface ChapterDefinition {
  id: string;
  sign: ZodiacSign;
  zodiacUrl: string;
  constellation: ConstellationDefinition;
  stages: readonly StageDefinition[];
}

export interface PlaySelection {
  chapterIndex: number;
  stageIndex: number;
}

export const zodiacSigns = [
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
] as const;

export type ZodiacSign = (typeof zodiacSigns)[number];

const stageMapUrls: Partial<Record<ZodiacSign, Readonly<Record<number, string>>>> = {
  ARIES: {
    0: new URL("@/maps/chapter-01.stage-01.map", import.meta.url).href,
    1: new URL("@/maps/chapter-01.stage-02.map", import.meta.url).href,
    2: new URL("@/maps/chapter-01.stage-03.map", import.meta.url).href,
  },
  TAURUS: {
    0: new URL("@/maps/chapter-02.stage-01.map", import.meta.url).href,
    2: new URL("@/maps/chapter-02.stage-03.map", import.meta.url).href,
    3: new URL("@/maps/chapter-02.stage-04.map", import.meta.url).href,
    4: new URL("@/maps/chapter-02.stage-05.map", import.meta.url).href,
  },
};

type ConstellationData = Record<ZodiacSign, unknown>;

const constellationData: ConstellationData = {
  ARIES: ariesConstellationData,
  TAURUS: taurusConstellationData,
  GEMINI: geminiConstellationData,
  CANCER: cancerConstellationData,
  LEO: leoConstellationData,
  VIRGO: virgoConstellationData,
  LIBRA: libraConstellationData,
  SCORPIUS: scorpiusConstellationData,
  SAGITTARIUS: sagittariusConstellationData,
  CAPRICORNUS: capricornusConstellationData,
  AQUARIUS: aquariusConstellationData,
  PISCES: piscesConstellationData,
};

const zodiacUrls: Record<ZodiacSign, string> = {
  ARIES: new URL("@/assets/zodiac/zodiac.aries.state-active.webp", import.meta.url).href,
  TAURUS: new URL("@/assets/zodiac/zodiac.taurus.state-active.webp", import.meta.url).href,
  GEMINI: new URL("@/assets/zodiac/zodiac.gemini.state-active.webp", import.meta.url).href,
  CANCER: new URL("@/assets/zodiac/zodiac.cancer.state-active.webp", import.meta.url).href,
  LEO: new URL("@/assets/zodiac/zodiac.leo.state-active.webp", import.meta.url).href,
  VIRGO: new URL("@/assets/zodiac/zodiac.virgo.state-active.webp", import.meta.url).href,
  LIBRA: new URL("@/assets/zodiac/zodiac.libra.state-active.webp", import.meta.url).href,
  SCORPIUS: new URL("@/assets/zodiac/zodiac.scorpio.state-active.webp", import.meta.url).href,
  SAGITTARIUS: new URL("@/assets/zodiac/zodiac.sagittarius.state-active.webp", import.meta.url)
    .href,
  CAPRICORNUS: new URL("@/assets/zodiac/zodiac.capricorn.state-active.webp", import.meta.url).href,
  AQUARIUS: new URL("@/assets/zodiac/zodiac.aquarius.state-active.webp", import.meta.url).href,
  PISCES: new URL("@/assets/zodiac/zodiac.pisces.state-active.webp", import.meta.url).href,
};

export const chapters: readonly ChapterDefinition[] = zodiacSigns.map((sign) => {
  const constellation = parseConstellation(constellationData[sign]);
  return {
    id: `chapter-${zodiacSigns.indexOf(sign) + 1}`,
    sign,
    zodiacUrl: zodiacUrls[sign],
    constellation,
    stages: Array.from({ length: constellation.points.length }, (_, stageIndex) => ({
      id: `chapter-${zodiacSigns.indexOf(sign) + 1}-stage-${stageIndex + 1}`,
      label: `STAGE ${stageIndex + 1}`,
      mapUrl: stageMapUrls[sign]?.[stageIndex],
    })),
  };
});

export const visibleChapters = chapters.slice(0, 4);

export function stageStatuses(chapterIndex: number): StageStatus[] {
  const chapter = chapters[chapterIndex]!;
  if (!isChapterUnlocked(chapterIndex)) return Array(chapter.stages.length).fill("locked");
  return deriveStageStatuses(
    chapter.stages.length,
    prerequisiteIndices(chapter.constellation),
    progressStore.clearedStages(chapterIndex, chapter.stages.length),
  );
}

export function isChapterCleared(chapterIndex: number): boolean {
  const chapter = chapters[chapterIndex]!;
  return (
    progressStore.clearedStages(chapterIndex, chapter.stages.length).size === chapter.stages.length
  );
}

export function isChapterUnlocked(chapterIndex: number): boolean {
  if (chapterIndex <= 0) return true;
  return isChapterCleared(chapterIndex - 1);
}

export function stageFor({ chapterIndex, stageIndex }: PlaySelection): StageDefinition {
  return chapters[chapterIndex]!.stages[stageIndex]!;
}

export function nextSelection({ chapterIndex, stageIndex }: PlaySelection): PlaySelection {
  if (stageIndex + 1 < chapters[chapterIndex]!.stages.length) {
    return { chapterIndex, stageIndex: stageIndex + 1 };
  }

  return { chapterIndex: (chapterIndex + 1) % visibleChapters.length, stageIndex: 0 };
}

export function nextStage(stage: Stage): Stage {
  const index = stage.index + 1;
  return index < stagesPerGroup
    ? { ...stage, index }
    : { group: (stage.group + 1) % stageGroups.length, index: 0 };
}
