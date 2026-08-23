import { describe, expect, it } from "vite-plus/test";

import { createEditorStore, resizeWouldDiscard } from "@/src/editor/editorStore";
import { createGameStoreFromMap } from "@/src/game/store/gameStore";
import { createBlankMap } from "@/src/map/mapDocument";

describe("맵 에디터 저장소", () => {
  it("웜홀을 배치 순서대로 두 개씩 연결한다", () => {
    const store = createEditorStore(undefined, () => 0);

    expect(store.getState().setTile({ x: 0, y: 0 }, "wormhole")).toBe(true);
    expect(store.getState().setTile({ x: 1, y: 0 }, "wormhole")).toBe(true);
    expect(store.getState().setTile({ x: 2, y: 0 }, "wormhole")).toBe(true);
    expect(store.getState().setTile({ x: 3, y: 0 }, "wormhole")).toBe(true);

    expect(store.getState().draft.tiles[0].filter((tile) => tile === "wormhole")).toHaveLength(4);
    expect(store.getState().draft.wormholePairs).toEqual([
      {
        id: 1,
        variant: 1,
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      },
      {
        id: 2,
        variant: 2,
        positions: [
          { x: 2, y: 0 },
          { x: 3, y: 0 },
        ],
      },
    ]);
  });

  it("새 웜홀 쌍에는 사용하지 않은 이미지를 무작위로 선택한다", () => {
    const store = createEditorStore(undefined, () => 0.999);
    for (let x = 0; x < 4; x += 1) store.getState().setTile({ x, y: 0 }, "wormhole");

    expect(store.getState().draft.wormholePairs.map((pair) => pair.variant)).toEqual([5, 4]);
  });

  it("웜홀 쌍의 한쪽을 덮어쓰면 쌍 전체를 제거한다", () => {
    const store = createEditorStore();
    store.getState().setTile({ x: 0, y: 0 }, "wormhole");
    store.getState().setTile({ x: 1, y: 0 }, "wormhole");

    store.getState().setTile({ x: 0, y: 0 }, "wall");

    expect(store.getState().draft.tiles[0].slice(0, 2)).toEqual(["wall", "floor"]);
    expect(store.getState().draft.wormholePairs).toEqual([]);
  });

  it("완성되지 않은 마지막 웜홀 쌍을 오류로 표시한다", () => {
    const store = createEditorStore();

    store.getState().setTile({ x: 0, y: 0 }, "wormhole");

    expect(store.getState().errors.map((error) => error.code)).toContain("wormhole-pair-count");
  });

  it("게이트를 하나만 배치한다", () => {
    const store = createEditorStore();

    expect(store.getState().setTile({ x: 0, y: 0 }, "gate")).toBe(true);
    expect(store.getState().setTile({ x: 1, y: 0 }, "gate")).toBe(false);
    expect(
      store
        .getState()
        .draft.tiles.flat()
        .filter((tile) => tile === "gate"),
    ).toHaveLength(1);
  });

  it("필드, 오브젝트 및 맵을 각각 초기화한다", () => {
    const store = createEditorStore(createBlankMap(3, 2));
    store.getState().setTile({ x: 1, y: 0 }, "plate");
    store.getState().setTile({ x: 2, y: 0 }, "exit");
    store.getState().placeObject({ x: 0, y: 1 }, "player");
    store.getState().placeObject({ x: 1, y: 1 }, "normal");

    store.getState().clearFields();
    expect(store.getState().draft.tiles.flat()).toEqual(Array(6).fill("floor"));
    expect(store.getState().draft.objects).toHaveLength(2);

    store.getState().clearObjects();
    expect(store.getState().draft.objects).toEqual([]);

    store.getState().setTile({ x: 0, y: 0 }, "wall");
    store.getState().placeObject({ x: 1, y: 1 }, "normal");
    store.getState().resetMap();
    expect(store.getState().draft).toEqual(createBlankMap(3, 2));
  });
  it("맵 확장 시 기존 필드를 유지하고 새 셀을 바닥으로 만든다", () => {
    const store = createEditorStore();
    store.getState().setTile({ x: 1, y: 1 }, "plate");

    store.getState().resize(11, 10);

    expect(store.getState().draft.tiles[1][1]).toBe("plate");
    expect(store.getState().draft.tiles[9][10]).toBe("floor");
  });

  it("맵 축소 시 범위 밖 필드와 오브젝트 제거 여부를 판정한다", () => {
    const map = createBlankMap(4, 4);
    map.tiles[2][2] = "wormhole";
    map.tiles[3][3] = "wormhole";
    map.wormholePairs = [
      {
        id: 1,
        variant: 1,
        positions: [
          { x: 2, y: 2 },
          { x: 3, y: 3 },
        ],
      },
    ];
    map.objects.push({ id: "normal-1", kind: "normal", position: { x: 3, y: 2 } });

    expect(resizeWouldDiscard(map, 3, 3)).toBe(true);

    const store = createEditorStore(map);
    store.getState().resize(3, 3);
    expect(store.getState().draft.objects).toEqual([]);
    expect(store.getState().draft.tiles).toHaveLength(3);
    expect(store.getState().draft.tiles[2][2]).toBe("floor");
    expect(store.getState().draft.wormholePairs).toEqual([]);
  });

  it("골과 플레이어를 새 좌표로 옮겨 하나만 유지한다", () => {
    const store = createEditorStore(createBlankMap(3, 3));
    store.getState().setTile({ x: 2, y: 0 }, "exit");
    store.getState().setTile({ x: 1, y: 0 }, "exit");
    store.getState().placeObject({ x: 0, y: 2 }, "player");
    store.getState().placeObject({ x: 1, y: 2 }, "player");

    const draft = store.getState().draft;
    expect(draft.tiles.flat().filter((tile) => tile === "exit")).toHaveLength(1);
    expect(draft.tiles[0][1]).toBe("exit");
    expect(draft.objects.filter((object) => object.kind === "player")).toEqual([
      { id: "player", kind: "player", position: { x: 1, y: 2 } },
    ]);
    expect(store.getState().errors).toEqual([]);
  });

  it("벽 배치와 지우기 규칙을 적용한다", () => {
    const store = createEditorStore(createBlankMap(2, 2));
    store.getState().placeObject({ x: 0, y: 0 }, "normal");
    store.getState().setTile({ x: 0, y: 0 }, "wall");
    store.getState().setTile({ x: 1, y: 0 }, "exit");
    store.getState().erase({ x: 1, y: 0 });

    expect(store.getState().draft.objects).toEqual([]);
    expect(store.getState().draft.tiles[0]).toEqual(["wall", "floor"]);
  });

  it("blank 필드는 오브젝트를 제거하고 새 배치를 허용하지 않는다", () => {
    const store = createEditorStore(createBlankMap(2, 2));
    store.getState().placeObject({ x: 0, y: 0 }, "normal");
    store.getState().setTile({ x: 0, y: 0 }, "blank");
    store.getState().placeObject({ x: 0, y: 0 }, "player");

    expect(store.getState().draft.tiles[0][0]).toBe("blank");
    expect(store.getState().draft.objects).toEqual([]);
  });

  it("맵 교체와 저장 완료 상태를 관리한다", () => {
    const store = createEditorStore();
    store.getState().setTile({ x: 0, y: 0 }, "wall");
    expect(store.getState().dirty).toBe(true);

    const replacement = createBlankMap(2, 2);
    store.getState().replaceMap(replacement);
    expect(store.getState().dirty).toBe(false);

    store.getState().setTile({ x: 0, y: 0 }, "plate");
    store.getState().markSaved();
    expect(store.getState().dirty).toBe(false);
  });

  it("라이브 테스트의 이동은 맵 초안을 변경하지 않는다", () => {
    const map = createBlankMap(3, 2);
    map.tiles[0][2] = "exit";
    map.objects.push({ id: "player", kind: "player", position: { x: 0, y: 1 } });
    const editor = createEditorStore(map);
    const testGame = createGameStoreFromMap(editor.getState().draft);

    testGame.getState().dispatch({ type: "player/move", direction: "right" });

    expect(testGame.getState().game.entities.player.position).toEqual({ x: 1, y: 1 });
    expect(editor.getState().draft.objects[0].position).toEqual({ x: 0, y: 1 });
  });
});
