import type { ConstellationDefinition } from "./model";

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface LayoutOptions {
  width: number;
  height: number;
  padding?: Partial<Padding>;
  emblemGap?: number;
  labelGap?: number;
  emblemSize?: { width: number; height: number };
}

export interface LayoutPoint {
  id: string;
  x: number;
  y: number;
}

export interface LayoutSegment {
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Anchor {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ConstellationLayout {
  width: number;
  height: number;
  points: readonly LayoutPoint[];
  segments: readonly LayoutSegment[];
  bounds: Bounds;
  emblemAnchor: Anchor;
  labelAnchor: Anchor;
}

const defaultPadding: Padding = { top: 0, right: 0, bottom: 0, left: 0 };

function span(values: readonly number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function offsetFor(size: number, start: number, used: number): number {
  return start + (size - used) / 2;
}

export function computeLayout(
  definition: ConstellationDefinition,
  options: LayoutOptions,
): ConstellationLayout {
  const { width, height } = options;
  if (definition.points.length === 0) {
    throw new Error(`별자리 "${definition.sign}"에 point가 없습니다.`);
  }
  const pointIds = new Set(definition.points.map(({ id }) => id));
  for (const edge of definition.edges) {
    if (!pointIds.has(edge.from) || !pointIds.has(edge.to)) {
      throw new Error(
        `별자리 "${definition.sign}"의 edge가 알 수 없는 point를 참조합니다: ${edge.from} → ${edge.to}`,
      );
    }
  }

  const pad = { ...defaultPadding, ...options.padding };
  const areaWidth = Math.max(width - pad.left - pad.right, 1);
  const areaHeight = Math.max(height - pad.top - pad.bottom, 1);
  const spanX = Math.max(span(definition.points.map(({ x }) => x)), Number.EPSILON);
  const spanY = Math.max(span(definition.points.map(({ y }) => y)), Number.EPSILON);

  const scale = Math.min(areaWidth / spanX, areaHeight / spanY);
  const usedWidth = spanX * scale;
  const usedHeight = spanY * scale;
  const originX = offsetFor(areaWidth, pad.left, usedWidth);
  const originY = offsetFor(areaHeight, pad.top, usedHeight);
  const minX = Math.min(...definition.points.map(({ x }) => x));
  const minY = Math.min(...definition.points.map(({ y }) => y));

  const points: LayoutPoint[] = definition.points.map(({ id, x, y }) => ({
    id,
    x: originX + (x - minX) * scale,
    y: originY + (y - minY) * scale,
  }));
  const byId = new Map(points.map((point) => [point.id, point]));

  const segments: LayoutSegment[] = definition.edges.map((edge) => {
    const from = byId.get(edge.from)!;
    const to = byId.get(edge.to)!;
    return { from: edge.from, to: edge.to, x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  });

  const bounds: Bounds = {
    minX: Math.min(...points.map(({ x }) => x)),
    minY: Math.min(...points.map(({ y }) => y)),
    maxX: Math.max(...points.map(({ x }) => x)),
    maxY: Math.max(...points.map(({ y }) => y)),
  };
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const emblemGap = options.emblemGap ?? 0;
  const labelGap = options.labelGap ?? 0;
  const emblemWidth = options.emblemSize?.width ?? 0;
  const emblemHeight = options.emblemSize?.height ?? 0;
  const emblemAnchor = { x: centerX - emblemWidth / 2, y: bounds.maxY + emblemGap };
  const labelAnchor = {
    x: centerX,
    y: bounds.maxY + emblemGap + emblemHeight + labelGap,
  };

  return { width, height, points, segments, bounds, emblemAnchor, labelAnchor };
}
