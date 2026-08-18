import type { FieldRule } from '@/src/game/features/ruleTypes';

export const floorRules = {
  kind: 'floor',
  acceptsObject: true,
} satisfies FieldRule;
