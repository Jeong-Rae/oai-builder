import type { FieldRule } from '../../ruleTypes';

export const wallRules = {
  kind: 'wall',
  acceptsObject: false,
  entryRejection: 'wall',
  objectPlacementError: {
    code: 'object-on-wall',
    message: (id: string) => `${id}을 벽에 배치할 수 없습니다.`,
  },
} satisfies FieldRule;
