import { describe, expect, it } from "vite-plus/test";

import { createGameStateFromMap } from "../../src/game/domain/level";
import { createBlankMap } from "../../src/map/mapDocument";

describe("맵 기반 게임 상태", () => {
  it("가변 크기 맵의 필드와 오브젝트를 게임 상태로 생성한다", () => {
    const map = createBlankMap(4, 3);
    map.tiles[0][3] = "exit";
    map.tiles[1][2] = "plate";
    map.tiles[0][0] = "wormhole";
    map.tiles[2][3] = "wormhole";
    map.wormholePairs = [
      {
        id: 1,
        variant: 4,
        positions: [
          { x: 0, y: 0 },
          { x: 3, y: 2 },
        ],
      },
    ];
    map.objects.push(
      { id: "player", kind: "player", position: { x: 0, y: 2 } },
      { id: "normal-7", kind: "normal", position: { x: 2, y: 1 } },
      { id: "anchor-2", kind: "anchor", position: { x: 1, y: 0 } },
      { id: "swapper-4", kind: "swapper", position: { x: 2, y: 0 } },
    );

    const game = createGameStateFromMap(map);

    expect(game).toMatchObject({
      columns: 4,
      rows: 3,
      tiles: map.tiles,
      wormholePairs: map.wormholePairs,
    });
    expect(game.entities.player.controls).toEqual(["up", "down", "left", "right"]);
    expect(game.entities["normal-7"]).toMatchObject({
      kind: "normal",
      position: { x: 2, y: 1 },
      controls: [],
    });
    expect(game.entities["anchor-2"].controls).toEqual([]);
    expect(game.entities["swapper-4"].controls).toEqual([]);
    expect(game.plateStates).toEqual({ "2,1": "inactive" });
  });

  it("맵 문서와 게임 상태의 배열을 서로 공유하지 않는다", () => {
    const map = createBlankMap(2, 2);
    map.tiles[0][1] = "exit";
    map.objects.push({ id: "player", kind: "player", position: { x: 0, y: 1 } });

    const game = createGameStateFromMap(map);
    game.tiles[0][0] = "wall";
    game.wormholePairs.push({ id: 1, variant: 1, positions: [] });
    game.entities.player.position.x = 1;

    expect(map.tiles[0][0]).toBe("floor");
    expect(map.wormholePairs).toEqual([]);
    expect(map.objects[0].position.x).toBe(0);
  });
});
