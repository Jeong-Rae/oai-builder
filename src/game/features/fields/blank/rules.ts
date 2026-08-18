import type { FieldRule } from '../../ruleTypes';

export const blankRules = {
  kind: 'blank',
  acceptsObject: false,
  entryRejection: 'out-of-bounds',
  objectPlacementError: {
    code: 'object-on-blank',
    message: (id: string) => `${id}을 맵 외부 영역에 배치할 수 없습니다.`,
  },
} satisfies FieldRule;
