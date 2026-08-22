import type { ConstellationDefinition } from "../constellation/model";

export type StageStatus = "cleared" | "current" | "available" | "locked";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = "stage-progress";

function storageKey(chapterIndex: number, stageIndex: number): string {
  return `${chapterIndex}:${stageIndex}`;
}

export interface ProgressStore {
  isCleared(chapterIndex: number, stageIndex: number): boolean;
  clearedStages(chapterIndex: number, stageCount: number): ReadonlySet<number>;
  markCleared(chapterIndex: number, stageIndex: number): void;
  reset(): void;
}

export function createProgressStore(storage?: KeyValueStorage): ProgressStore {
  let cleared = new Set<string>();
  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      const parsed: unknown = raw === null ? undefined : JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cleared = new Set(parsed.filter((entry): entry is string => typeof entry === "string"));
      }
    } catch {
      cleared = new Set();
    }
  }

  const persist = (): void => {
    storage?.setItem(STORAGE_KEY, JSON.stringify([...cleared]));
  };

  return {
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
    markCleared(chapterIndex, stageIndex) {
      const key = storageKey(chapterIndex, stageIndex);
      if (cleared.has(key)) return;
      cleared.add(key);
      persist();
    },
    reset() {
      cleared = new Set();
      persist();
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

export const progressStore = createProgressStore(
  typeof localStorage !== "undefined" ? localStorage : undefined,
);
