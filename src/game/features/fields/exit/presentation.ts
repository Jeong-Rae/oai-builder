import type { AssetSlot, FieldPresentation } from '../../presentationTypes';

export const goalAssetSlots = ['goalFrame1', 'goalFrame2', 'goalFrame3', 'goalFrame4'] as const;

export function goalAsset(frame: number): AssetSlot {
  return goalAssetSlots[Math.max(0, Math.min(goalAssetSlots.length - 1, frame - 1))];
}

export const exitPresentation = {
  kind: 'exit',
  label: '골',
  assets: {
    goalFrame1: { label: '골·1프레임', url: new URL('../../../../../assets/goal/goal_1f.1254.png', import.meta.url).href, group: 'goal' },
    goalFrame2: { label: '골·2프레임', url: new URL('../../../../../assets/goal/goal_2f.1254.png', import.meta.url).href, group: 'goal' },
    goalFrame3: { label: '골·3프레임', url: new URL('../../../../../assets/goal/goal_3f.1254.png', import.meta.url).href, group: 'goal' },
    goalFrame4: { label: '골·4프레임', url: new URL('../../../../../assets/goal/goal_4f.1254.png', import.meta.url).href, group: 'goal' },
  },
  toolAsset: 'goalFrame1',
  gameTextures: goalAssetSlots,
  editorAsset: () => undefined,
  gameTexture: () => 'floor',
  overlayAsset: (_game, _positionKey, frame) => goalAsset(frame),
} satisfies FieldPresentation;
