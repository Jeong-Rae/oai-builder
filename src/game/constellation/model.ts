export interface StarPoint {
  id: string;
  x: number;
  y: number;
}

export interface StarEdge {
  from: string;
  to: string;
}

export interface ConstellationDefinition {
  sign: string;
  points: readonly StarPoint[];
  edges: readonly StarEdge[];
}
