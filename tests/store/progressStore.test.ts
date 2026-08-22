import { describe, expect, it } from "vite-plus/test";

import { parseConstellation } from "../../src/game/constellation/parse";
import ariesData from "../../src/game/data/constellations/aries.json";
import {
  createProgressStore,
  deriveStageStatuses,
  prerequisiteIndices,
  type KeyValueStorage,
} from "../../src/game/store/progressStore";

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const aries = parseConstellation(ariesData);

describe("스테이지 진행 상태", () => {
  it("edge에서 각 스테이지의 선행 조건을 계산한다", () => {
    expect(prerequisiteIndices(aries)).toEqual([[], [0], [1], [2]]);
  });

  it("초기에는 첫 스테이지가 현재이고 나머지는 잠겨 있다", () => {
    const statuses = deriveStageStatuses(4, prerequisiteIndices(aries), new Set());
    expect(statuses).toEqual(["current", "locked", "locked", "locked"]);
  });

  it("클리어하면 다음 스테이지가 현재가 된다", () => {
    const statuses = deriveStageStatuses(4, prerequisiteIndices(aries), new Set([0]));
    expect(statuses).toEqual(["cleared", "current", "locked", "locked"]);
  });

  it("모두 클리어하면 현재 스테이지가 없다", () => {
    const statuses = deriveStageStatuses(4, prerequisiteIndices(aries), new Set([0, 1, 2, 3]));
    expect(statuses).toEqual(["cleared", "cleared", "cleared", "cleared"]);
  });

  it("분기 별자리에서는 선행 노드 하나만 클리어해도 해금된다", () => {
    const prerequisites: readonly (readonly number[])[] = [[], [0], [1], [2], [2]];
    const statuses = deriveStageStatuses(5, prerequisites, new Set([0, 1, 2]));
    expect(statuses).toEqual(["cleared", "cleared", "cleared", "current", "available"]);
  });

  it("진행 상태를 저장소에 영구 저장한다", () => {
    const storage = memoryStorage();
    const store = createProgressStore(storage);
    expect(store.isCleared(0, 0)).toBe(false);
    store.markCleared(0, 0);
    store.markCleared(0, 1);
    expect(store.isCleared(0, 0)).toBe(true);
    expect(store.clearedStages(0, 4)).toEqual(new Set([0, 1]));

    const restored = createProgressStore(storage);
    expect(restored.clearedStages(0, 4)).toEqual(new Set([0, 1]));
    expect(restored.clearedStages(1, 4)).toEqual(new Set());
  });
});
