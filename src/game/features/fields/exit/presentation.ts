import type { FieldPresentation } from '@/src/game/features/presentationTypes';

export const exitPresentation = {
  kind: 'exit',
  label: '골',
  assets: {
    goalStar: { label: '골', url: new URL('@/assets/goal/goal.star.webp', import.meta.url).href, group: 'goal' },
  },
  toolAsset: 'goalStar',
  gameTextures: ['goalStar'],
  editorAsset: () => undefined,
  gameTexture: () => 'floor',
  overlayAsset: () => 'goalStar',
} satisfies FieldPresentation;
