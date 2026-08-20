import type { FieldPresentation } from '@/src/game/features/presentationTypes';

const plateUrl = new URL('@/assets/plate/plate.overlay.png', import.meta.url).href;

export const platePresentation = {
  kind: 'plate',
  label: '플레이트',
  assets: {
    plateInactive: { label: '플레이트·비활성', url: plateUrl, group: 'field' },
    plateActive: { label: '플레이트·활성', url: plateUrl, group: 'field' },
  },
  toolAsset: 'plateInactive',
  gameTextures: ['plateInactive', 'plateActive'],
  editorAsset: (game, positionKey) => game?.plateStates[positionKey] === 'active' ? 'plateActive' : 'plateInactive',
  gameTexture: () => 'floor',
  overlayAsset: (game, positionKey) => game?.plateStates[positionKey] === 'active' ? 'plateActive' : 'plateInactive',
} satisfies FieldPresentation;
