import type { ObjectPresentation } from '@/src/game/features/presentationTypes';

export const swapperPresentation = {
  kind: 'swapper',
  label: '스와퍼',
  assets: {
    swapper: {
      label: '스와퍼',
      url: new URL('@/assets/swapper/swapper.origin.webp', import.meta.url).href,
      group: 'object',
    },
  },
  toolAsset: 'swapper',
  gameTextures: ['swapper'],
  editorAsset: 'swapper',
  gameTexture: 'swapper',
} satisfies ObjectPresentation;
