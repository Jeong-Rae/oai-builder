import type { Entity, GameEvent } from '../../../domain/types';
import type { ObjectRule } from '../../ruleTypes';

export const swapperRules = {
  kind: 'swapper',
  movable: true,
  activatesPlate: false,
  initialControls: [],
} satisfies ObjectRule;

export function swapperCollisionEvents(first: Entity, second: Entity): GameEvent[] | undefined {
  if (first.kind !== 'swapper' && second.kind !== 'swapper') return undefined;
  return [{ type: 'controls/swapped', firstEntityId: first.id, secondEntityId: second.id }];
}
