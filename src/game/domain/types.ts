export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  x: number;
  y: number;
}

export interface WormholePair {
  id: number;
  variant: number;
  positions: Position[];
}

export type TileKind = "blank" | "floor" | "wall" | "exit" | "plate" | "wormhole" | "gate";
export type PlateState = "inactive" | "active";
export type ObjectKind = "player" | "normal" | "anchor" | "swapper";

export interface Player {
  id: "player";
  kind: "player";
  position: Position;
  controls: Direction[];
}

export interface Normal {
  id: string;
  kind: "normal";
  position: Position;
  controls: Direction[];
}

export interface Anchor {
  id: string;
  kind: "anchor";
  position: Position;
  controls: Direction[];
}

export interface Swapper {
  id: string;
  kind: "swapper";
  position: Position;
  controls: Direction[];
}

export type Entity = Player | Normal | Anchor | Swapper;

export interface GameState {
  columns: number;
  rows: number;
  tiles: TileKind[][];
  wormholePairs: WormholePair[];
  entities: Record<string, Entity>;
  playerId: "player";
  plateStates: Record<string, PlateState>;
  status: "playing" | "completed";
}

export type GameCommand = {
  type: "player/move";
  direction: Direction;
};

export type GameEvent =
  | {
      type: "entity/moved";
      entityId: string;
      from: Position;
      to: Position;
      wormhole?: Position;
    }
  | {
      type: "control/transferred";
      direction: Direction;
      fromEntityId: string;
      toEntityId: string;
    }
  | {
      type: "controls/swapped";
      firstEntityId: string;
      secondEntityId: string;
    }
  | {
      type: "plate/activated" | "plate/deactivated";
      position: Position;
    }
  | {
      type: "game/completed";
    };

export type RejectionReason = "out-of-bounds" | "wall" | "fixed" | "occupied";

export interface Decision {
  events: GameEvent[];
  rejectedBy?: RejectionReason;
}
