import type {
  Direction,
  GameState,
  ObjectKind,
  RejectionReason,
  TileKind,
} from '../domain/types';

export interface CountRule {
  valid(count: number): boolean;
  code: string;
  message: string;
}

export interface EditorPlacementRule {
  maxCount: number;
  overflow: 'reject' | 'replace';
}

export interface FieldRule {
  kind: TileKind;
  acceptsObject: boolean;
  entryRejection?: RejectionReason | ((state: GameState) => RejectionReason | undefined);
  editorPlacement?: EditorPlacementRule;
  count?: CountRule;
  objectPlacementError?: {
    code: string;
    message(id: string): string;
  };
}

export interface ObjectRule {
  kind: ObjectKind;
  movable: boolean;
  activatesPlate: boolean;
  initialControls: readonly Direction[];
  editorPlacement?: EditorPlacementRule;
  count?: CountRule;
  fixedId?: {
    value: string;
    code: string;
    message: string;
  };
}
