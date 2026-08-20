import type { ObjectPresentation } from '@/src/game/features/presentationTypes';

export const anchorPresentation = {
  kind: 'anchor',
  label: '앵커',
  assets: {
    anchor: {
      label: '앵커',
      url: new URL('@/assets/anchor/anchor.origin.webp', import.meta.url).href,
      group: 'object',
    },
  },
  toolAsset: 'anchor',
  gameTextures: ['anchor'],
  editorAsset: 'anchor',
  gameTexture: 'anchor',
} satisfies ObjectPresentation;
