import type { GameState } from '@/src/game/domain/types';
import type { FieldRule } from '@/src/game/features/ruleTypes';

export function isGateOpen(state: GameState): boolean {
  const plates = Object.values(state.plateStates);
  return plates.length > 0 && plates.every((plate) => plate === 'active');
}

export const gateRules = {
  kind: 'gate',
  acceptsObject: true,
  entryRejection: (state: GameState) => isGateOpen(state) ? undefined : 'wall',
  editorPlacement: { maxCount: 1, overflow: 'reject' },
  count: {
    valid: (count: number) => count <= 1,
    code: 'gate-count',
    message: '게이트는 최대 하나만 배치할 수 있습니다.',
  },
} satisfies FieldRule;
