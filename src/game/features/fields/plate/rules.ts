import type { Entity, GameEvent, GameState, PlateState, Position } from '@/src/game/domain/types';
import type { FieldRule } from '@/src/game/features/ruleTypes';

export const plateRules = {
  kind: 'plate',
  acceptsObject: true,
} satisfies FieldRule;

export function createPlateStates(tiles: GameState['tiles']): Record<string, PlateState> {
  return Object.fromEntries(
    tiles.flatMap((row, y) =>
      row.flatMap((tile, x) => (tile === 'plate' ? [[`${x},${y}`, 'inactive' as const]] : [])),
    ),
  );
}

export function plateEvents(state: GameState, entity: Entity, target: Position, activatesPlate: boolean): GameEvent[] {
  if (!activatesPlate) return [];

  const events: GameEvent[] = [];
  const fromKey = `${entity.position.x},${entity.position.y}`;
  const targetKey = `${target.x},${target.y}`;

  if (state.tiles[entity.position.y][entity.position.x] === 'plate' && state.plateStates[fromKey] === 'active') {
    events.push({ type: 'plate/deactivated', position: entity.position });
  }
  if (state.tiles[target.y][target.x] === 'plate' && state.plateStates[targetKey] === 'inactive') {
    events.push({ type: 'plate/activated', position: target });
  }

  return events;
}
