import { isGateOpen } from './rules';
import type { FieldPresentation } from '../../presentationTypes';

const gateUrl = new URL('../../../../../assets/tile/tile.origin.png', import.meta.url).href;

export const gatePresentation = {
  kind: 'gate',
  label: '게이트',
  assets: {
    gateClosed: { label: '게이트·닫힘', url: gateUrl, group: 'field' },
    gateOpen: { label: '게이트·열림', url: gateUrl, group: 'field' },
  },
  toolAsset: 'gateClosed',
  gameTextures: [],
  editorAsset: (game) => game && isGateOpen(game) ? 'gateOpen' : 'gateClosed',
  gameTexture: () => 'floor',
} satisfies FieldPresentation;
