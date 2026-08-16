import { describe, expect, it } from 'vitest';

import { mapFilename, readMapFile } from '../../src/editor/mapFiles';
import { createBlankMap, serializeMap } from '../../src/map/mapDocument';

describe('맵 파일', () => {
  it('파일 이름에 map 확장자를 한 번만 붙인다', () => {
    expect(mapFilename('first-room')).toBe('first-room.map');
    expect(mapFilename('first-room.MAP')).toBe('first-room.MAP');
    expect(mapFilename('   ')).toBe('untitled.map');
  });

  it('map 확장자가 아닌 파일을 읽지 않는다', async () => {
    const result = await readMapFile({ name: 'room.json', text: async () => '{}' });

    expect(result.ok ? undefined : result.errors[0].code).toBe('extension');
  });

  it('유효한 map 파일을 읽는다', async () => {
    const map = createBlankMap(2, 2);
    map.tiles[0][1] = 'exit';
    map.objects.push({ id: 'player', kind: 'player', position: { x: 0, y: 1 } });

    const result = await readMapFile({ name: 'room.map', text: async () => serializeMap(map) });

    expect(result).toEqual({ ok: true, map });
  });
});
