import type { ObjectPresentation } from '@/src/game/features/presentationTypes';

export const anchorPresentation = {
  kind: 'anchor',
  label: '앵커',
  assets: {
    anchor: {
      label: '앵커',
      url: new URL('@/assets/box/box.origin.png', import.meta.url).href,
      group: 'object',
    },
  },
  toolAsset: 'anchor',
  gameTextures: [],
  editorAsset: 'anchor',
  gameTexture: 'normal',
} satisfies ObjectPresentation;
