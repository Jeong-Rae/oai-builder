import type { FieldPresentation } from '@/src/game/features/presentationTypes';

export const wallPresentation = {
  kind: 'wall',
  label: '벽',
  assets: {
    wall: {
      label: '벽',
      url: new URL('@/assets/tile/tile.origin.png', import.meta.url).href,
      group: 'field',
    },
  },
  toolAsset: 'wall',
  gameTextures: ['wall'],
  editorAsset: () => 'wall',
  gameTexture: () => 'wall',
} satisfies FieldPresentation;
