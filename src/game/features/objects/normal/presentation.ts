import type { ObjectPresentation } from '@/src/game/features/presentationTypes';

export const normalPresentation = {
  kind: 'normal',
  label: '일반',
  assets: {
    normal: {
      label: '일반 오브젝트',
      url: new URL('@/assets/box/box.origin.png', import.meta.url).href,
      group: 'object',
    },
  },
  toolAsset: 'normal',
  gameTextures: ['normal'],
  editorAsset: 'normal',
  gameTexture: 'normal',
} satisfies ObjectPresentation;
