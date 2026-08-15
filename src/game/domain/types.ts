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
}

export interface Box {
  id: string;
  kind: 'box';
  position: Position;
}

export type Entity = Player | Box;

export interface GameState {
  columns: number;
  rows: number;
  tiles: TileKind[][];
  entities: Record<string, Entity>;
  playerId: 'player';
  status: 'playing' | 'completed';
}

export type GameCommand = {
  type: 'player/move';
  direction: Direction;
};

export type GameEvent =
  | {
      type: 'player/moved';
      playerId: 'player';
      from: Position;
      to: Position;
    }
  | {
      type: 'box/pushed';
      boxId: string;
      from: Position;
      to: Position;
    }
  | {
      type: 'game/completed';
    };

export type RejectionReason = 'out-of-bounds' | 'blocked-box';

export interface Decision {
  events: GameEvent[];
  rejectedBy?: RejectionReason;
}
