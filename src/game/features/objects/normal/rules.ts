import type { ObjectRule } from '@/src/game/features/ruleTypes';

export const normalRules = {
  kind: 'normal',
  movable: true,
  activatesPlate: true,
  initialControls: [],
} satisfies ObjectRule;
