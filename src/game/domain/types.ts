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
}

export type GameCommand = {
  type: 'player/move';
  direction: Direction;
};

export type GameEvent = {
  type: 'player/moved';
  playerId: 'player';
  from: Position;
  to: Position;
};

export type RejectionReason = 'out-of-bounds' | 'blocked-entity';

export interface Decision {
  events: GameEvent[];
  rejectedBy?: RejectionReason;
}
