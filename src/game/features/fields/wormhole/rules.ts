import type { GameState, Position } from '../../../domain/types';
import type { FieldRule } from '../../ruleTypes';

export const wormholeRules = {
  kind: 'wormhole',
  acceptsObject: true,
  editorPlacement: { maxCount: 2, overflow: 'reject' },
  count: {
    valid: (count: number) => count === 0 || count === 2,
    code: 'wormhole-count',
    message: '웜홀은 사용하지 않거나 정확히 두 개여야 합니다.',
  },
} satisfies FieldRule;

export function wormholeDestination(state: GameState, position: Position): Position | undefined {
  const wormholes = state.tiles.flatMap((row, y) =>
    row.flatMap((tile, x) => tile === 'wormhole' ? [{ x, y }] : []),
  );
  return wormholes.find((wormhole) => wormhole.x !== position.x || wormhole.y !== position.y);
}
