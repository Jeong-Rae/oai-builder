import type { FieldPresentation } from '@/src/game/features/presentationTypes';

export const blankPresentation = {
  kind: 'blank',
  label: '맵 외부',
  badge: '∅',
  assets: {},
  gameTextures: [],
  editorAsset: () => undefined,
  gameTexture: () => undefined,
} satisfies FieldPresentation;
