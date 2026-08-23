import type { GameState, ObjectKind, TileKind } from "../domain/types";

export type AssetSlot =
  | "floor"
  | "wall"
  | "platePawHigh"
  | "platePawMid"
  | "platePawLow"
  | "wormhole01"
  | "wormhole02"
  | "wormhole03"
  | "wormhole04"
  | "wormhole05"
  | "wormhole06"
  | "wormhole07"
  | "wormhole08"
  | "wormhole09"
  | "wormhole10"
  | "wormhole11"
  | "wormhole12"
  | "wormhole13"
  | "wormhole14"
  | "wormhole15"
  | "gateDeviceWarn"
  | "gateLaserWarn"
  | "gateDeviceSafe"
  | "normal"
  | "anchor"
  | "swapper"
  | "playerDefault"
  | "playerUp"
  | "playerDown"
  | "playerLeft"
  | "playerRight"
  | "goalStar"
  | "up"
  | "down"
  | "left"
  | "right";

export type AssetGroup = "field" | "object" | "goal" | "control";

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
  overlayAsset?(game: GameState | undefined, positionKey: string): AssetSlot | undefined;
  overlayFit?: "square" | "height";
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
