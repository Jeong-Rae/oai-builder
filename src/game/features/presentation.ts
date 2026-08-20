import type { Direction, Entity, GameState, ObjectKind, TileKind } from '../domain/types';
import { controlAssets, controlAssetSlots } from './controls/presentation';
import { blankPresentation } from './fields/blank/presentation';
import { exitPresentation, goalAsset, goalAssetSlots } from './fields/exit/presentation';
import { floorPresentation } from './fields/floor/presentation';
import { gatePresentation } from './fields/gate/presentation';
import { platePresentation } from './fields/plate/presentation';
import { wallPresentation } from './fields/wall/presentation';
import { wormholePresentation } from './fields/wormhole/presentation';
import { anchorPresentation } from './objects/anchor/presentation';
import { normalPresentation } from './objects/normal/presentation';
import { playerPresentation } from './objects/player/presentation';
import { swapperPresentation } from './objects/swapper/presentation';
import type {
  AssetDefinition,
  AssetGroup,
  AssetSlot,
  FieldPresentation,
  ObjectPresentation,
} from './presentationTypes';

export { goalAsset, goalAssetSlots };
export { playerTextureForMove, playerTextureKeys } from './objects/player/presentation';
export type { AssetSlot } from './presentationTypes';

export const fieldPresentations: Record<TileKind, FieldPresentation> = {
  blank: blankPresentation,
  floor: floorPresentation,
  wall: wallPresentation,
  plate: platePresentation,
  exit: exitPresentation,
  wormhole: wormholePresentation,
  gate: gatePresentation,
};

export const objectPresentations: Record<ObjectKind, ObjectPresentation> = {
  player: playerPresentation,
  normal: normalPresentation,
  anchor: anchorPresentation,
  swapper: swapperPresentation,
};

export const assetDefinitions = {
  ...floorPresentation.assets,
  ...wallPresentation.assets,
  ...platePresentation.assets,
  ...wormholePresentation.assets,
  ...gatePresentation.assets,
  ...normalPresentation.assets,
  ...anchorPresentation.assets,
  ...swapperPresentation.assets,
  ...playerPresentation.assets,
  ...exitPresentation.assets,
  ...controlAssets,
} as Record<AssetSlot, AssetDefinition>;

export const assetUrls = Object.fromEntries(
  Object.entries(assetDefinitions).map(([key, asset]) => [key, asset.url]),
) as Record<AssetSlot, string>;

const groupLabels: Record<AssetGroup, string> = {
  field: '필드', object: '오브젝트', goal: '골 애니메이션', control: '방향 표시',
};

export const assetGroups = (Object.keys(groupLabels) as AssetGroup[]).map((group) => ({
  label: groupLabels[group],
  keys: (Object.keys(assetDefinitions) as AssetSlot[]).filter((key) => assetDefinitions[key].group === group),
}));

export const gameTextureSlots = Array.from(new Set<AssetSlot>([
  ...Object.values(fieldPresentations).flatMap((presentation) => presentation.gameTextures),
  ...Object.values(objectPresentations).flatMap((presentation) => presentation.gameTextures),
  ...Object.values(controlAssetSlots),
]));

export function assetForField(field: TileKind, game: GameState | undefined, positionKey: string): AssetSlot | undefined {
  return fieldPresentations[field].editorAsset(game, positionKey);
}

export function baseAssetForField(field: TileKind): AssetSlot | undefined {
  return field === 'blank' ? undefined : field === 'wall' ? 'wall' : 'floor';
}

export function textureForField(field: TileKind, game: GameState, positionKey: string): AssetSlot | undefined {
  return fieldPresentations[field].gameTexture(game, positionKey);
}

export function overlayForField(field: TileKind, game: GameState | undefined, positionKey: string, frame: number): AssetSlot | undefined {
  return fieldPresentations[field].overlayAsset?.(game, positionKey, frame);
}

export function assetForObject(kind: ObjectKind): AssetSlot {
  return objectPresentations[kind].editorAsset;
}

export function textureForEntity(entity: Entity): AssetSlot {
  return objectPresentations[entity.kind].gameTexture;
}

export function assetForDirection(direction: Direction): AssetSlot {
  return controlAssetSlots[direction];
}
