import type { InspectorTarget } from "@/src/game/inspector/types";

interface InspectorDataset extends DOMStringMap {
  inspectorId?: string;
  inspectorKind?: string;
  inspectorLabel?: string;
  inspectorSourceFile?: string;
  inspectorSourceSymbol?: string;
}

export interface InspectableHtmlElement extends HTMLElement {
  dataset: InspectorDataset;
}

const MAX_DESCRIPTION_LENGTH = 80;
const FALLBACK_DATA_ATTRIBUTES = ["data-testid", "data-test", "data-role"] as const;

function compact(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  return normalized.slice(0, MAX_DESCRIPTION_LENGTH);
}

function present(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function escapeIdentifier(value: string): string {
  return value.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, (character) => {
    const codePoint = character.codePointAt(0)?.toString(16) ?? "0";
    return `\\${codePoint} `;
  });
}

function escapeAttributeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function typePosition(element: HTMLElement): number {
  if (!element.parentElement) return 0;
  const siblings = Array.from(element.parentElement.children).filter(
    (sibling) => sibling.tagName === element.tagName,
  );
  return siblings.indexOf(element) + 1;
}

function elementSegment(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  if (element.id) return `${tag}#${escapeIdentifier(element.id)}`;

  const position = typePosition(element);
  const positionSuffix = position > 0 ? `:nth-of-type(${position})` : "";

  for (const attribute of FALLBACK_DATA_ATTRIBUTES) {
    const value = compact(element.getAttribute(attribute));
    if (value) {
      return `${tag}[${attribute}="${escapeAttributeValue(value)}"]${positionSuffix}`;
    }
  }

  const classes = Array.from(element.classList)
    .filter(Boolean)
    .slice(0, 2)
    .map((className) => `.${escapeIdentifier(className)}`)
    .join("");
  return `${tag}${classes}${positionSuffix}`;
}

export function createDomPath(element: HTMLElement): string {
  const segments: string[] = [];
  let current: HTMLElement | null = element;
  while (current) {
    segments.unshift(elementSegment(current));
    if (current.id || current.tagName === "BODY") break;
    current = current.parentElement;
  }
  return segments.join(" > ");
}

function deriveLabel(element: HTMLElement): string {
  return (
    compact(element.getAttribute("aria-label")) ??
    compact(element.getAttribute("alt")) ??
    compact(element.getAttribute("title")) ??
    compact(element.textContent) ??
    element.tagName.toLowerCase()
  );
}

function describeRuntime(element: HTMLElement, selector: string): Record<string, unknown> {
  const attributes: Record<string, string> = {};
  for (const name of ["id", "class", "role", "name", "type", "aria-label", "alt", "title"]) {
    const value = compact(element.getAttribute(name));
    if (value) attributes[name] = value;
  }
  for (const name of FALLBACK_DATA_ATTRIBUTES) {
    const value = compact(element.getAttribute(name));
    if (value) attributes[name] = value;
  }
  return {
    selector,
    tagName: element.tagName.toLowerCase(),
    label: deriveLabel(element),
    ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
  };
}

export function buildInspectorTarget(element: InspectableHtmlElement): InspectorTarget {
  const rect = element.getBoundingClientRect();
  const explicitId = present(element.dataset.inspectorId);
  const selector = createDomPath(element);
  const target: InspectorTarget = {
    id: explicitId ?? `dom:${selector}`,
    kind: "dom",
    bounds: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
  };

  const kind = present(element.dataset.inspectorKind);
  if (kind === "game-object" || kind === "map-cell") target.kind = kind;

  const explicitLabel = present(element.dataset.inspectorLabel);
  target.label = explicitLabel ?? deriveLabel(element);

  const file = present(element.dataset.inspectorSourceFile);
  const symbol = present(element.dataset.inspectorSourceSymbol);
  if (file || symbol) target.source = { file, symbol };

  if (!explicitId) target.runtime = describeRuntime(element, selector);
  return target;
}

export function advanceCandidateIndex(current: number, deltaY: number, length: number): number {
  if (length <= 0) return -1;
  if (deltaY === 0) return Math.max(0, Math.min(current, length - 1));
  const direction = deltaY >= 0 ? 1 : -1;
  return (current + direction + length) % length;
}
