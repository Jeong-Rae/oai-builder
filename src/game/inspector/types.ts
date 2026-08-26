export type InspectorTargetKind = "dom" | "game-object" | "map-cell";

export interface InspectorBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InspectorTargetSource {
  file?: string;
  symbol?: string;
}

export interface InspectorTarget {
  id: string;
  kind: InspectorTargetKind;
  label?: string;
  bounds?: InspectorBounds;
  source?: InspectorTargetSource;
  runtime?: Record<string, unknown>;
}

export type GameToWrapperMessage =
  | { type: "inspector:ready" }
  | { type: "inspector:selected"; target: InspectorTarget };

export type WrapperToGameMessage = { type: "inspector:mode"; enabled: boolean };
