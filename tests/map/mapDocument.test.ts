import { describe, expect, it } from "vite-plus/test";

import {
  createBlankMap,
  parseMap,
  serializeMap,
  validateMap,
  type MapDocument,
} from "../../src/map/mapDocument";

function validMap(): MapDocument {
  const map = createBlankMap(3, 2);
  map.tiles[0][2] = "exit";
  map.objects.push(
    { id: "player", kind: "player", position: { x: 0, y: 1 } },
    { id: "normal-1", kind: "normal", position: { x: 1, y: 1 } },
  );
  return map;
}

describe("맵 문서", () => {
  it("내보낸 맵을 손실 없이 다시 읽는다", () => {
    const map = validMap();

    expect(parseMap(serializeMap(map))).toEqual({ ok: true, map });
  });

  it("플레이어와 골이 없는 맵을 거절한다", () => {
    const result = validateMap(createBlankMap(2, 2));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toEqual(
        expect.arrayContaining(["player-count", "exit-count"]),
      );
    }
  });

  it("벽 위 오브젝트와 중복 점유를 거절한다", () => {
    const map = validMap();
    map.tiles[1][0] = "wall";
    map.objects.push({ id: "normal-2", kind: "normal", position: { x: 1, y: 1 } });

    const result = validateMap(map);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toEqual(
        expect.arrayContaining(["object-on-wall", "occupied"]),
      );
    }
  });

  it("blank 필드를 보존하고 해당 필드의 오브젝트를 거절한다", () => {
    const map = validMap();
    map.tiles[1][0] = "blank";

    const result = parseMap(serializeMap(map));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toContain("object-on-blank");
    }
  });

  it("여러 웜홀 쌍을 좌표와 함께 보존한다", () => {
    const map = validMap();
    const positions = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ];
    positions.forEach(({ x, y }) => {
      map.tiles[y][x] = "wormhole";
    });
    map.wormholePairs = [
      { id: 1, variant: 5, positions: positions.slice(0, 2) },
      { id: 2, variant: 12, positions: positions.slice(2, 4) },
    ];

    expect(parseMap(serializeMap(map))).toEqual({ ok: true, map });
  });

  it("불완전하거나 필드와 일치하지 않는 웜홀 쌍을 거절한다", () => {
    const incomplete = validMap();
    incomplete.tiles[0][0] = "wormhole";
    incomplete.wormholePairs = [{ id: 1, variant: 1, positions: [{ x: 0, y: 0 }] }];
    const mismatched = validMap();
    mismatched.wormholePairs = [
      {
        id: 1,
        variant: 1,
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      },
    ];

    expect(validateMap(incomplete).ok).toBe(false);
    expect(validateMap(mismatched).ok).toBe(false);
  });

  it("웜홀 이미지 번호를 검증하고 번호가 없는 초기 버전 2 쌍은 첫 이미지로 보정한다", () => {
    const map = validMap();
    map.tiles[0][0] = "wormhole";
    map.tiles[0][1] = "wormhole";
    const pair = {
      id: 1,
      positions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    };

    const compatible = validateMap({ ...map, wormholePairs: [pair] });
    const invalid = validateMap({ ...map, wormholePairs: [{ ...pair, variant: 16 }] });

    expect(compatible.ok).toBe(true);
    if (compatible.ok) expect(compatible.map.wormholePairs[0].variant).toBe(1);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok)
      expect(invalid.errors.map((error) => error.code)).toContain("wormhole-variant");
  });

  it("버전 1의 웜홀 두 개를 버전 2의 한 쌍으로 변환한다", () => {
    const current = validMap();
    current.tiles[0][0] = "wormhole";
    current.tiles[1][2] = "wormhole";
    const { wormholePairs: _, ...legacy } = current;

    const result = validateMap({ ...legacy, version: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.map.version).toBe(2);
      expect(result.map.wormholePairs).toEqual([
        {
          id: 1,
          variant: 1,
          positions: [
            { x: 0, y: 0 },
            { x: 2, y: 1 },
          ],
        },
      ]);
    }

    const invalidLegacy = { ...legacy, tiles: legacy.tiles.map((row) => [...row]) };
    invalidLegacy.tiles[0][1] = "wormhole";
    expect(validateMap({ ...invalidLegacy, version: 1 }).ok).toBe(false);
  });

  it("중복된 웜홀 쌍 식별자와 좌표를 거절한다", () => {
    const map = validMap();
    map.tiles[0][0] = "wormhole";
    map.tiles[0][1] = "wormhole";
    map.tiles[1][2] = "wormhole";
    map.wormholePairs = [
      {
        id: 1,
        variant: 1,
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      },
      {
        id: 1,
        variant: 2,
        positions: [
          { x: 0, y: 0 },
          { x: 2, y: 1 },
        ],
      },
    ];

    const result = validateMap(map);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toEqual(
        expect.arrayContaining(["wormhole-pair-id", "wormhole-position"]),
      );
    }
  });

  it("게이트는 최대 하나만 허용한다", () => {
    const map = validMap();
    map.tiles[0][0] = "gate";
    map.tiles[1][2] = "gate";

    const result = validateMap(map);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain("gate-count");
  });

  it("잘못된 JSON과 지원하지 않는 버전을 구분한다", () => {
    const invalidJson = parseMap("{");
    const unsupported = parseMap(JSON.stringify({ ...validMap(), version: 3 }));

    expect(invalidJson.ok ? undefined : invalidJson.errors[0].code).toBe("json");
    expect(unsupported.ok ? undefined : unsupported.errors[0].code).toBe("version");
  });

  it("불러온 문서에서 런타임 상태와 알 수 없는 키를 제거한다", () => {
    const source = {
      ...validMap(),
      status: "completed",
      objects: validMap().objects.map((object) => ({ ...object, controls: ["up"] })),
    };

    const result = parseMap(JSON.stringify(source));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(serializeMap(result.map)).not.toContain("status");
      expect(serializeMap(result.map)).not.toContain("controls");
    }
  });
});
