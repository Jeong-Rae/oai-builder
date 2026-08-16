import { parseMap, serializeMap, type MapDocument, type MapResult } from '../map/mapDocument';

export function mapFilename(name: string): string {
  const trimmed = name.trim() || 'untitled';
  return trimmed.toLowerCase().endsWith('.map') ? trimmed : `${trimmed}.map`;
}

export async function readMapFile(file: Pick<File, 'name' | 'text'>): Promise<MapResult> {
  if (!file.name.toLowerCase().endsWith('.map')) {
    return { ok: false, errors: [{ code: 'extension', message: '.map 파일만 불러올 수 있습니다.' }] };
  }

  return parseMap(await file.text());
}

export function downloadMap(map: MapDocument, name: string): void {
  const blob = new Blob([serializeMap(map)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = mapFilename(name);
  link.click();
  URL.revokeObjectURL(url);
}
