import type { Entity, GameEvent } from '@/src/game/domain/types';
import type { ObjectRule } from '@/src/game/features/ruleTypes';

export const anchorRules = {
  kind: 'anchor',
  movable: false,
  activatesPlate: false,
  initialControls: [],
} satisfies ObjectRule;

export function anchorCollisionEvents(owner: Entity, anchor: Entity): GameEvent[] | undefined {
  if (anchor.kind !== 'anchor' || anchor.controls.length === 0) return undefined;
  return anchor.controls.map((direction) => ({
    type: 'control/transferred' as const,
    direction,
    fromEntityId: anchor.id,
    toEntityId: owner.id,
  }));
}
