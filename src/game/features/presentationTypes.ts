import type { GameState, ObjectKind, TileKind } from '../domain/types';

export type AssetSlot =
  | 'floor' | 'wall' | 'plateInactive' | 'plateActive' | 'wormhole' | 'gateClosed' | 'gateOpen'
  | 'normal' | 'anchor' | 'swapper'
  | 'playerDefault' | 'playerUp' | 'playerDown' | 'playerLeft' | 'playerRight'
  | 'goalFrame1' | 'goalFrame2' | 'goalFrame3' | 'goalFrame4'
  | 'up' | 'down' | 'left' | 'right';

export type AssetGroup = 'field' | 'object' | 'goal' | 'control';

export interface AssetDefinition {
  label: string;
  url: string;
  group: AssetGroup;
}

export interface FieldPresentation {
  kind: TileKind;
  label: string;
  badge?: string;
  assets: Partial<Record<AssetSlot, AssetDefinition>>;
  toolAsset?: AssetSlot;
  gameTextures: readonly AssetSlot[];
  editorAsset(game: GameState | undefined, positionKey: string): AssetSlot | undefined;
  gameTexture(game: GameState, positionKey: string): AssetSlot | undefined;
  overlayAsset?(game: GameState | undefined, positionKey: string, frame: number): AssetSlot | undefined;
}

export interface ObjectPresentation {
  kind: ObjectKind;
  label: string;
  assets: Partial<Record<AssetSlot, AssetDefinition>>;
  toolAsset: AssetSlot;
  gameTextures: readonly AssetSlot[];
  editorAsset: AssetSlot;
  gameTexture: AssetSlot;
}
