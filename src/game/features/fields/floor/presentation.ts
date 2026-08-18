import type { FieldPresentation } from '../../presentationTypes';

export const floorPresentation = {
  kind: 'floor',
  label: '바닥',
  assets: {
    floor: {
      label: '바닥',
      url: new URL('../../../../../assets/tile/tile.origin.trimmed.png', import.meta.url).href,
      group: 'field',
    },
  },
  toolAsset: 'floor',
  gameTextures: ['floor'],
  editorAsset: () => 'floor',
  gameTexture: () => 'floor',
} satisfies FieldPresentation;
