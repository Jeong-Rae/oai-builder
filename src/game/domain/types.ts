export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export type TileKind = 'floor' | 'wall' | 'exit';

export interface Player {
  id: 'player';
  kind: 'player';
  position: Position;
  controls: Direction[];
}

export interface Box {
  id: string;
  kind: 'box';
  position: Position;
  controls: Direction[];
}

export type Entity = Player | Box;

export interface GameState {
  columns: number;
  rows: number;
  tiles: TileKind[][];
  entities: Record<string, Entity>;
  playerId: 'player';
  gateOpened: boolean;
  status: 'playing' | 'completed';
}

export type GameCommand = {
  type: 'player/move';
  direction: Direction;
};

export type GameEvent =
  | {
      type: 'entity/moved';
      entityId: string;
      from: Position;
      to: Position;
    }
  | {
      type: 'control/transferred';
      direction: Direction;
      fromEntityId: string;
      toEntityId: string;
    }
  | {
      type: 'gate/opened';
    }
  | {
      type: 'game/completed';
    };

export type RejectionReason = 'out-of-bounds' | 'wall';

export interface Decision {
  events: GameEvent[];
  rejectedBy?: RejectionReason;
}
