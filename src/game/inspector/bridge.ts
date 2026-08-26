import type { InspectorTarget, WrapperToGameMessage } from "@/src/game/inspector/types";

const HIGHLIGHT_ID = "inspector-highlight-overlay";

interface InspectableElement extends HTMLElement {
  dataset: DOMStringMap & {
    inspectorId?: string;
    inspectorKind?: string;
    inspectorLabel?: string;
    inspectorSourceFile?: string;
    inspectorSourceSymbol?: string;
  };
}

function findInspectable(target: EventTarget | null): InspectableElement | null {
  if (!(target instanceof Element)) return null;
  const element = target.closest<HTMLElement>("[data-inspector-id]");
  return element ? (element as InspectableElement) : null;
}

function buildTarget(element: InspectableElement): InspectorTarget {
  const rect = element.getBoundingClientRect();
  const target: InspectorTarget = {
    id: element.dataset.inspectorId!,
    kind: "dom",
  };
  const kind = element.dataset.inspectorKind;
  if (kind === "game-object" || kind === "map-cell") {
    target.kind = kind;
  }
  const label = element.dataset.inspectorLabel;
  if (label) target.label = label;
  target.bounds = {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
  const file = element.dataset.inspectorSourceFile;
  const symbol = element.dataset.inspectorSourceSymbol;
  if (file || symbol) {
    target.source = { file, symbol };
  }
  return target;
}

function ensureHighlight(): HTMLDivElement {
  let overlay = document.getElementById(HIGHLIGHT_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = HIGHLIGHT_ID;
    overlay.style.cssText =
      "position:fixed;pointer-events:none;z-index:2147483647;" +
      "border:2px solid #7612FA;border-radius:6px;" +
      "box-shadow:0 0 0 3px rgba(118,18,250,0.25);" +
      "transition:left 60ms linear,top 60ms linear,width 60ms linear,height 60ms linear;";
    document.body.append(overlay);
  }
  return overlay as HTMLDivElement;
}

function moveHighlight(element: HTMLElement): void {
  const overlay = ensureHighlight();
  const rect = element.getBoundingClientRect();
  overlay.style.display = "block";
  overlay.style.left = `${rect.x - 2}px`;
  overlay.style.top = `${rect.y - 2}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

function hideHighlight(): void {
  const overlay = document.getElementById(HIGHLIGHT_ID);
  if (overlay) overlay.style.display = "none";
}

export function installInspectorBridge(): () => void {
  let enabled = false;

  const postToWrapper = (message: unknown): void => {
    if (window.parent === window) return;
    window.parent.postMessage(message, "*");
  };

  const onPointerMove = (event: PointerEvent): void => {
    const element = findInspectable(event.target);
    if (element) moveHighlight(element);
    else hideHighlight();
  };

  const onClick = (event: MouseEvent): void => {
    const element = findInspectable(event.target);
    hideHighlight();
    event.preventDefault();
    event.stopImmediatePropagation();
    if (element) {
      postToWrapper({ type: "inspector:selected", target: buildTarget(element) });
    }
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (enabled) event.stopImmediatePropagation();
  };

  const enable = (): void => {
    enabled = true;
    document.body.dataset.inspectorMode = "on";
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
  };

  const disable = (): void => {
    enabled = false;
    delete document.body.dataset.inspectorMode;
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKeyDown, true);
    hideHighlight();
  };

  const onMessage = (event: MessageEvent): void => {
    const data = event.data as WrapperToGameMessage | undefined;
    if (data?.type === "inspector:mode") {
      if (data.enabled) enable();
      else disable();
    }
  };

  window.addEventListener("message", onMessage);
  postToWrapper({ type: "inspector:ready" });

  return () => {
    disable();
    window.removeEventListener("message", onMessage);
    document.getElementById(HIGHLIGHT_ID)?.remove();
  };
}
