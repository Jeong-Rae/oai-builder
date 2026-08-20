import { isGateOpen } from './rules';
import type { FieldPresentation } from '@/src/game/features/presentationTypes';

const gateUrl = new URL('@/assets/tile/tile.origin.png', import.meta.url).href;

export const gatePresentation = {
  kind: 'gate',
  label: '게이트',
  assets: {
    gateClosed: { label: '게이트·닫힘', url: gateUrl, group: 'field' },
    gateOpen: { label: '게이트·열림', url: gateUrl, group: 'field' },
  },
  toolAsset: 'gateClosed',
  gameTextures: ['gateClosed', 'gateOpen'],
  editorAsset: (game) => game && isGateOpen(game) ? 'gateOpen' : 'gateClosed',
  gameTexture: () => 'floor',
  overlayAsset: (game) => game && isGateOpen(game) ? 'gateOpen' : 'gateClosed',
} satisfies FieldPresentation;
