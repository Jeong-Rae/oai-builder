import { describe, expect, it } from 'vitest';

import {
  createBlankMap,
  parseMap,
  serializeMap,
  validateMap,
  type MapDocument,
} from '../../src/map/mapDocument';

function validMap(): MapDocument {
  const map = createBlankMap(3, 2);
  map.tiles[0][2] = 'exit';
  map.objects.push(
    { id: 'player', kind: 'player', position: { x: 0, y: 1 } },
    { id: 'normal-1', kind: 'normal', position: { x: 1, y: 1 } },
  );
  return map;
}

describe('맵 문서', () => {
  it('내보낸 맵을 손실 없이 다시 읽는다', () => {
    const map = validMap();

    expect(parseMap(serializeMap(map))).toEqual({ ok: true, map });
  });

  it('플레이어와 골이 없는 맵을 거절한다', () => {
    const result = validateMap(createBlankMap(2, 2));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining(['player-count', 'exit-count']));
    }
  });

  it('벽 위 오브젝트와 중복 점유를 거절한다', () => {
    const map = validMap();
    map.tiles[1][0] = 'wall';
    map.objects.push({ id: 'normal-2', kind: 'normal', position: { x: 1, y: 1 } });

    const result = validateMap(map);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining(['object-on-wall', 'occupied']));
    }
  });

  it('blank 필드를 보존하고 해당 필드의 오브젝트를 거절한다', () => {
    const map = validMap();
    map.tiles[1][0] = 'blank';

    const result = parseMap(serializeMap(map));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toContain('object-on-blank');
    }
  });

  it('잘못된 JSON과 지원하지 않는 버전을 구분한다', () => {
    const invalidJson = parseMap('{');
    const unsupported = parseMap(JSON.stringify({ ...validMap(), version: 2 }));

    expect(invalidJson.ok ? undefined : invalidJson.errors[0].code).toBe('json');
    expect(unsupported.ok ? undefined : unsupported.errors[0].code).toBe('version');
  });

  it('불러온 문서에서 런타임 상태와 알 수 없는 키를 제거한다', () => {
    const source = {
      ...validMap(),
      status: 'completed',
      objects: validMap().objects.map((object) => ({ ...object, controls: ['up'] })),
    };

    const result = parseMap(JSON.stringify(source));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(serializeMap(result.map)).not.toContain('status');
      expect(serializeMap(result.map)).not.toContain('controls');
    }
  });
});
