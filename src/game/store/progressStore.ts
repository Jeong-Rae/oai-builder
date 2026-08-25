import type { ConstellationDefinition } from "../constellation/model";
import type { GameDataStore } from "@/src/game/dataStore";

export type StageStatus = "cleared" | "current" | "available" | "locked";

const STORAGE_KEY = "progress";
const TUTORIAL_STORAGE_KEY = "tutorial-completed";
const TUTORIAL_STAGE_STORAGE_KEY = "tutorial-stage";
const ENTRY_TUTORIAL_STORAGE_KEY = "entry-tutorial";

function storageKey(chapterIndex: number, stageIndex: number): string {
  return `${chapterIndex}:${stageIndex}`;
}

export interface ProgressStore {
  isTutorialCompleted(): boolean;
  tutorialStageIndex(): number;
  isEntryTutorialCompleted(chapterIndex: number, stageIndex: number): boolean;
  isCleared(chapterIndex: number, stageIndex: number): boolean;
  clearedStages(chapterIndex: number, stageCount: number): ReadonlySet<number>;
  markTutorialStageCompleted(stageIndex: number): Promise<void>;
  markTutorialCompleted(): Promise<void>;
  markEntryTutorialCompleted(chapterIndex: number, stageIndex: number): Promise<void>;
  markCleared(chapterIndex: number, stageIndex: number): Promise<void>;
  reset(): Promise<void>;
}

export async function createProgressStore(storage?: GameDataStore): Promise<ProgressStore> {
  let cleared = new Set<string>();
  let tutorialCompleted = (await storage?.get(TUTORIAL_STORAGE_KEY)) === "true";
  const storedTutorialStage = await storage?.get(TUTORIAL_STAGE_STORAGE_KEY);
  let tutorialStage = storedTutorialStage == null ? 0 : Number(storedTutorialStage);
  if (!Number.isSafeInteger(tutorialStage) || tutorialStage < 0) {
    throw new Error("저장된 튜토리얼 진행 상태를 읽을 수 없습니다.");
  }
  let entryTutorialCompletedKeys = new Set<string>();
  if (storage) {
    const raw = await storage.get(STORAGE_KEY);
    if (raw !== null) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("저장된 진행 상태를 읽을 수 없습니다.");
      }
      if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === "string")) {
        throw new Error("저장된 진행 상태를 읽을 수 없습니다.");
      }
      cleared = new Set(parsed);
    }
    const entryRaw = await storage.get(ENTRY_TUTORIAL_STORAGE_KEY);
    if (entryRaw !== null) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(entryRaw);
      } catch {
        throw new Error("저장된 튜토리얼 진행 상태를 읽을 수 없습니다.");
      }
      if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === "string")) {
        throw new Error("저장된 튜토리얼 진행 상태를 읽을 수 없습니다.");
      }
      entryTutorialCompletedKeys = new Set(parsed);
    }
  }

  const persist = async (next: ReadonlySet<string>): Promise<void> => {
    await storage?.set(STORAGE_KEY, JSON.stringify([...next]));
  };

  return {
    isTutorialCompleted() {
      return tutorialCompleted;
    },
    tutorialStageIndex() {
      return tutorialStage;
    },
    isEntryTutorialCompleted(chapterIndex, stageIndex) {
      return entryTutorialCompletedKeys.has(storageKey(chapterIndex, stageIndex));
    },
    isCleared(chapterIndex, stageIndex) {
      return cleared.has(storageKey(chapterIndex, stageIndex));
    },
    clearedStages(chapterIndex, stageCount) {
      const indices = new Set<number>();
      for (let stageIndex = 0; stageIndex < stageCount; stageIndex += 1) {
        if (cleared.has(storageKey(chapterIndex, stageIndex))) indices.add(stageIndex);
      }
      return indices;
    },
    async markTutorialStageCompleted(stageIndex) {
      const nextStage = stageIndex + 1;
      if (nextStage <= tutorialStage) return;
      await storage?.set(TUTORIAL_STAGE_STORAGE_KEY, String(nextStage));
      tutorialStage = nextStage;
    },
    async markTutorialCompleted() {
      if (tutorialCompleted) return;
      await storage?.set(TUTORIAL_STORAGE_KEY, "true");
      tutorialCompleted = true;
    },
    async markEntryTutorialCompleted(chapterIndex, stageIndex) {
      const key = storageKey(chapterIndex, stageIndex);
      if (entryTutorialCompletedKeys.has(key)) return;
      await storage?.set(
        ENTRY_TUTORIAL_STORAGE_KEY,
        JSON.stringify([...entryTutorialCompletedKeys, key]),
      );
      entryTutorialCompletedKeys = new Set(entryTutorialCompletedKeys).add(key);
    },
    async markCleared(chapterIndex, stageIndex) {
      const key = storageKey(chapterIndex, stageIndex);
      if (cleared.has(key)) return;
      const next = new Set(cleared).add(key);
      await persist(next);
      cleared = next;
    },
    async reset() {
      const next = new Set<string>();
      await persist(next);
      await storage?.remove(TUTORIAL_STORAGE_KEY);
      await storage?.remove(TUTORIAL_STAGE_STORAGE_KEY);
      await storage?.remove(ENTRY_TUTORIAL_STORAGE_KEY);
      cleared = next;
      tutorialCompleted = false;
      tutorialStage = 0;
      entryTutorialCompletedKeys = new Set();
    },
  };
}

export function prerequisiteIndices(
  constellation: ConstellationDefinition,
): readonly (readonly number[])[] {
  const indexById = new Map(constellation.points.map((point, index) => [point.id, index]));
  const prerequisites = constellation.points.map(() => [] as number[]);
  for (const edge of constellation.edges) {
    const from = indexById.get(edge.from);
    const to = indexById.get(edge.to);
    if (from === undefined || to === undefined || from === to) continue;
    if (!prerequisites[to]!.includes(from)) prerequisites[to]!.push(from);
  }
  return prerequisites;
}

export function deriveStageStatuses(
  stageCount: number,
  prerequisites: readonly (readonly number[])[],
  clearedIndices: ReadonlySet<number>,
): StageStatus[] {
  const unlocked = prerequisites.map((needed, index) =>
    needed.length === 0 ? true : needed.some((from) => clearedIndices.has(from)),
  );
  let currentIndex = -1;
  for (let index = 0; index < stageCount; index += 1) {
    if (unlocked[index] && !clearedIndices.has(index)) {
      currentIndex = index;
      break;
    }
  }
  return Array.from({ length: stageCount }, (_, index) => {
    if (clearedIndices.has(index)) return "cleared";
    if (index === currentIndex) return "current";
    return unlocked[index] ? "available" : "locked";
  });
}

export let progressStore = await createProgressStore();

export async function initializeProgressStore(storage: GameDataStore): Promise<void> {
  progressStore = await createProgressStore(storage);
}
