import type { FieldPresentation } from '../../presentationTypes';

export const wallPresentation = {
  kind: 'wall',
  label: '벽',
  assets: {
    wall: {
      label: '벽',
      url: new URL('../../../../../assets/tile/tile.origin.png', import.meta.url).href,
      group: 'field',
    },
  },
  toolAsset: 'wall',
  gameTextures: [],
  editorAsset: () => 'wall',
  gameTexture: () => 'floor',
} satisfies FieldPresentation;
