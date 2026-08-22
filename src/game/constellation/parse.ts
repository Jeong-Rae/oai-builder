import type { ConstellationDefinition, StarEdge, StarPoint } from "./model";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePoint(value: unknown, sign: string, index: number): StarPoint {
  if (!isRecord(value)) {
    throw new Error(`별자리 "${sign}"의 point ${index}가 객체가 아닙니다.`);
  }
  const { id, x, y } = value;
  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`별자리 "${sign}"의 point ${index}에 유효한 id가 없습니다.`);
  }
  if (typeof x !== "number" || typeof y !== "number") {
    throw new Error(`별자리 "${sign}"의 point "${id}" 좌표가 숫자가 아닙니다.`);
  }
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`별자리 "${sign}"의 point "${id}" 좌표가 유한수가 아닙니다.`);
  }
  return { id, x, y };
}

function parseEdge(
  value: unknown,
  sign: string,
  index: number,
  ids: ReadonlySet<string>,
): StarEdge {
  if (!isRecord(value)) {
    throw new Error(`별자리 "${sign}"의 edge ${index}가 객체가 아닙니다.`);
  }
  const endpoints: Record<"from" | "to", string> = { from: "", to: "" };
  for (const key of ["from", "to"] as const) {
    const id = value[key];
    if (typeof id !== "string" || !ids.has(id)) {
      throw new Error(
        `별자리 "${sign}"의 edge ${index}의 ${key}가 알 수 없는 point를 참조합니다: ${String(id)}`,
      );
    }
    endpoints[key] = id;
  }
  return endpoints;
}

export function parseConstellation(data: unknown): ConstellationDefinition {
  if (!isRecord(data)) {
    throw new Error("별자리 데이터가 객체가 아닙니다.");
  }
  const { sign, points, edges } = data;
  if (typeof sign !== "string" || sign.length === 0) {
    throw new Error("별자리 데이터에 유효한 sign이 없습니다.");
  }
  if (!Array.isArray(points) || points.length === 0) {
    throw new Error(`별자리 "${sign}"에 point가 없습니다.`);
  }
  if (!Array.isArray(edges)) {
    throw new Error(`별자리 "${sign}"에 edges 배열이 없습니다.`);
  }
  const parsedPoints = points.map((point, index) => parsePoint(point, sign, index));
  const ids = new Set(parsedPoints.map(({ id }) => id));
  if (ids.size !== parsedPoints.length) {
    throw new Error(`별자리 "${sign}"의 point id가 중복됩니다.`);
  }
  const parsedEdges = edges.map((edge, index) => parseEdge(edge, sign, index, ids));
  return { sign, points: parsedPoints, edges: parsedEdges };
}
