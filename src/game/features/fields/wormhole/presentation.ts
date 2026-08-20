import type { FieldPresentation } from '@/src/game/features/presentationTypes';

export const wormholePresentation = {
  kind: 'wormhole',
  label: '웜홀',
  assets: {
    wormhole: {
      label: '웜홀',
      url: new URL('@/assets/wormhole/wormhole.origin.webp', import.meta.url).href,
      group: 'field',
    },
  },
  toolAsset: 'wormhole',
  gameTextures: ['wormhole'],
  editorAsset: () => 'wormhole',
  gameTexture: () => 'floor',
  overlayAsset: () => 'wormhole',
  overlayFit: 'height',
} satisfies FieldPresentation;
