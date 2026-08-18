import type { ObjectPresentation } from '../../presentationTypes';

export const swapperPresentation = {
  kind: 'swapper',
  label: '스와퍼',
  assets: {
    swapper: {
      label: '스와퍼',
      url: new URL('../../../../../assets/swapper/swapper.origin.png', import.meta.url).href,
      group: 'object',
    },
  },
  toolAsset: 'swapper',
  gameTextures: ['swapper'],
  editorAsset: 'swapper',
  gameTexture: 'swapper',
} satisfies ObjectPresentation;
