import type { ObjectKind, TileKind } from '../domain/types';
import { anchorRules } from './objects/anchor/rules';
import { normalRules } from './objects/normal/rules';
import { playerRules } from './objects/player/rules';
import { swapperRules } from './objects/swapper/rules';
import { blankRules } from './fields/blank/rules';
import { exitRules } from './fields/exit/rules';
import { floorRules } from './fields/floor/rules';
import { gateRules } from './fields/gate/rules';
import { plateRules } from './fields/plate/rules';
import { wallRules } from './fields/wall/rules';
import { wormholeRules } from './fields/wormhole/rules';
import type { FieldRule, ObjectRule } from './ruleTypes';

export const fieldRules: Record<TileKind, FieldRule> = {
  blank: blankRules,
  floor: floorRules,
  wall: wallRules,
  plate: plateRules,
  exit: exitRules,
  wormhole: wormholeRules,
  gate: gateRules,
};

export const objectRules: Record<ObjectKind, ObjectRule> = {
  player: playerRules,
  normal: normalRules,
  anchor: anchorRules,
  swapper: swapperRules,
};

export const fieldKinds = Object.keys(fieldRules) as TileKind[];
export const objectKinds = Object.keys(objectRules) as ObjectKind[];
