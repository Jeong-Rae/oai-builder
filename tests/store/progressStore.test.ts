import { describe, expect, it } from "vite-plus/test";

import { parseConstellation } from "@/src/game/constellation/parse";
import ariesData from "@/src/game/data/constellations/aries.json";
import {
  createProgressStore,
  deriveStageStatuses,
  prerequisiteIndices,
} from "@/src/game/store/progressStore";
import type { GameDataStore } from "@/src/game/dataStore";

function memoryStorage(): GameDataStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => void data.set(key, value),
    remove: async (key) => void data.delete(key),
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

  it("진행 상태를 저장소에 영구 저장한다", async () => {
    const storage = memoryStorage();
    const store = await createProgressStore(storage);
    expect(store.isCleared(0, 0)).toBe(false);
    await store.markCleared(0, 0);
    await store.markCleared(0, 1);
    expect(store.isCleared(0, 0)).toBe(true);
    expect(store.clearedStages(0, 4)).toEqual(new Set([0, 1]));

    const restored = await createProgressStore(storage);
    expect(restored.clearedStages(0, 4)).toEqual(new Set([0, 1]));
    expect(restored.clearedStages(1, 4)).toEqual(new Set());
  });

  it("튜토리얼 완료 상태를 플레이어 저장소에 영구 저장한다", async () => {
    const storage = memoryStorage();
    const store = await createProgressStore(storage);
    expect(store.isTutorialCompleted()).toBe(false);

    await store.markTutorialCompleted();

    expect(store.isTutorialCompleted()).toBe(true);
    expect((await createProgressStore(storage)).isTutorialCompleted()).toBe(true);
  });

  it("완료한 튜토리얼 스테이지 다음부터 이어서 진행한다", async () => {
    const storage = memoryStorage();
    const store = await createProgressStore(storage);

    await store.markTutorialStageCompleted(0);
    await store.markTutorialStageCompleted(1);

    expect(store.tutorialStageIndex()).toBe(2);
    expect((await createProgressStore(storage)).tutorialStageIndex()).toBe(2);
  });

  it("입장 튜토리얼 완료 상태를 플레이어 저장소에 영구 저장한다", async () => {
    const storage = memoryStorage();
    const store = await createProgressStore(storage);
    expect(store.isEntryTutorialCompleted(1, 0)).toBe(false);

    await store.markEntryTutorialCompleted(1, 0);

    expect(store.isEntryTutorialCompleted(1, 0)).toBe(true);
    expect(store.isEntryTutorialCompleted(1, 1)).toBe(false);
    expect((await createProgressStore(storage)).isEntryTutorialCompleted(1, 0)).toBe(true);
  });

  it("초기화하면 스테이지 진행도와 튜토리얼 완료 상태를 함께 지운다", async () => {
    const storage = memoryStorage();
    const store = await createProgressStore(storage);
    await store.markCleared(0, 0);
    await store.markTutorialStageCompleted(0);
    await store.markTutorialCompleted();
    await store.markEntryTutorialCompleted(1, 0);

    await store.reset();

    expect(store.isCleared(0, 0)).toBe(false);
    expect(store.isTutorialCompleted()).toBe(false);
    expect(store.tutorialStageIndex()).toBe(0);
    expect(store.isEntryTutorialCompleted(1, 0)).toBe(false);
    expect(storage.data.has("tutorial-completed")).toBe(false);
    expect(storage.data.has("tutorial-stage")).toBe(false);
    expect(storage.data.has("entry-tutorial")).toBe(false);
  });

  it("손상된 진행 상태를 정상 데이터로 사용하지 않는다", async () => {
    const storage = memoryStorage();
    storage.data.set("progress", "not-json");
    await expect(createProgressStore(storage)).rejects.toThrow(
      "저장된 진행 상태를 읽을 수 없습니다.",
    );
  });

  it("저장에 실패하면 메모리에서도 클리어로 처리하지 않는다", async () => {
    const storage = memoryStorage();
    storage.set = async () => {
      throw new Error("quota exceeded");
    };
    const store = await createProgressStore(storage);
    await expect(store.markCleared(0, 0)).rejects.toThrow("quota exceeded");
    expect(store.isCleared(0, 0)).toBe(false);
  });

  it("저장에 실패하면 튜토리얼도 완료로 처리하지 않는다", async () => {
    const storage = memoryStorage();
    const store = await createProgressStore(storage);
    storage.set = async () => {
      throw new Error("quota exceeded");
    };

    await expect(store.markTutorialCompleted()).rejects.toThrow("quota exceeded");
    expect(store.isTutorialCompleted()).toBe(false);
  });

  it("손상된 튜토리얼 진행 상태를 정상 데이터로 사용하지 않는다", async () => {
    const storage = memoryStorage();
    storage.data.set("tutorial-stage", "잘못된 값");

    await expect(createProgressStore(storage)).rejects.toThrow(
      "저장된 튜토리얼 진행 상태를 읽을 수 없습니다.",
    );
  });
});
