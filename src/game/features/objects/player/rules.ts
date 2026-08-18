import type { ObjectRule } from '../../ruleTypes';

export const playerRules = {
  kind: 'player',
  movable: true,
  activatesPlate: false,
  initialControls: ['up', 'down', 'left', 'right'],
  editorPlacement: { maxCount: 1, overflow: 'replace' },
  count: {
    valid: (count: number) => count === 1,
    code: 'player-count',
    message: '플레이어는 정확히 하나여야 합니다.',
  },
  fixedId: {
    value: 'player',
    code: 'player-id',
    message: '플레이어 식별자는 player여야 합니다.',
  },
} satisfies ObjectRule;
