import {
  advanceCandidateIndex,
  buildInspectorTarget,
  createDomPath,
  isVisibleCandidateAtPoint,
  orderInspectorCandidates,
  type InspectableHtmlElement,
} from "@/src/game/inspector/domTarget";
import type { WrapperToGameMessage } from "@/src/game/inspector/types";

const HIGHLIGHT_ID = "inspector-highlight-overlay";

const EXCLUDED_TAGS = new Set(["HTML", "SCRIPT", "STYLE", "META", "LINK", "HEAD"]);

function asHtmlElement(element: Element): HTMLElement | null {
  if (element instanceof HTMLElement) return element;
  return element.parentElement;
}

function collectHitCandidates(x: number, y: number): InspectableHtmlElement[] {
  const candidates: InspectableHtmlElement[] = [];
  const seen = new Set<HTMLElement>();
  const append = (element: HTMLElement): void => {
    if (element.id === HIGHLIGHT_ID || EXCLUDED_TAGS.has(element.tagName) || seen.has(element)) {
      return;
    }
    seen.add(element);
    candidates.push(element as InspectableHtmlElement);
  };
  for (const hit of document.elementsFromPoint(x, y)) {
    let current = asHtmlElement(hit);
    const ancestry: HTMLElement[] = [];
    while (current) {
      ancestry.push(current);
      current = current.parentElement;
    }
    const explicitlyInspectable = ancestry.find((element) => element.dataset.inspectorId?.trim());
    if (explicitlyInspectable) append(explicitlyInspectable);
    ancestry.forEach(append);
  }
  return candidates;
}

function collectExpandedCandidates(x: number, y: number): InspectableHtmlElement[] {
  const hitCandidates = collectHitCandidates(x, y);
  const geometricCandidates: HTMLElement[] = [];
  for (const element of document.querySelectorAll("*")) {
    if (!(element instanceof HTMLElement)) continue;
    if (element.id === HIGHLIGHT_ID || EXCLUDED_TAGS.has(element.tagName)) continue;
    if (!isVisibleCandidateAtPoint(element, x, y, getComputedStyle(element))) continue;
    geometricCandidates.push(element);
  }
  return orderInspectorCandidates([...hitCandidates, ...geometricCandidates], hitCandidates);
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
  let candidates: InspectableHtmlElement[] = [];
  let candidateIndex = -1;
  let pointerX = -1;
  let pointerY = -1;

  const postToWrapper = (message: unknown): void => {
    if (window.parent === window) return;
    window.parent.postMessage(message, "*");
  };

  const showCandidate = (): void => {
    const candidate = candidates[candidateIndex];
    if (candidate) moveHighlight(candidate);
    else hideHighlight();
  };

  const refreshCandidates = (x: number, y: number): void => {
    pointerX = x;
    pointerY = y;
    candidates = collectHitCandidates(x, y);
    candidateIndex = candidates.length > 0 ? 0 : -1;
    showCandidate();
  };

  const onPointerMove = (event: PointerEvent): void => {
    refreshCandidates(event.clientX, event.clientY);
  };

  const onWheel = (event: WheelEvent): void => {
    if (!event.shiftKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.clientX !== pointerX || event.clientY !== pointerY) {
      refreshCandidates(event.clientX, event.clientY);
    }
    const currentCandidate = candidates[candidateIndex];
    candidates = collectExpandedCandidates(event.clientX, event.clientY);
    candidateIndex = currentCandidate ? candidates.indexOf(currentCandidate) : -1;
    if (candidateIndex < 0 && candidates.length > 0) candidateIndex = 0;
    candidateIndex = advanceCandidateIndex(
      candidateIndex,
      event.deltaY || event.deltaX,
      candidates.length,
    );
    showCandidate();
    if (import.meta.env.DEV) {
      const direction = event.deltaY || event.deltaX;
      const selected = candidates[candidateIndex];
      console.groupCollapsed(
        `[VisualTask Inspector] Shift+Wheel ${direction >= 0 ? "down" : "up"} · ${candidateIndex + 1}/${candidates.length}`,
      );
      console.log("Pointer:", { x: event.clientX, y: event.clientY });
      console.table(
        candidates.map((candidate, index) => {
          const rect = candidate.getBoundingClientRect();
          return {
            selected: index === candidateIndex ? "▶" : "",
            index,
            tag: candidate.tagName.toLowerCase(),
            id: candidate.dataset.inspectorId || candidate.id || `dom:${createDomPath(candidate)}`,
            class: candidate.className,
            depth: createDomPath(candidate).split(" > ").length,
            pointerEvents: getComputedStyle(candidate).pointerEvents,
            bounds: `${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.width)}×${Math.round(rect.height)}`,
          };
        }),
      );
      console.log("Selected candidate:", selected ?? null);
      console.groupEnd();
    }
  };

  const onClick = (event: MouseEvent): void => {
    if (event.clientX !== pointerX || event.clientY !== pointerY) {
      refreshCandidates(event.clientX, event.clientY);
    }
    const element = candidates[candidateIndex];
    hideHighlight();
    event.preventDefault();
    event.stopImmediatePropagation();
    if (element) {
      postToWrapper({ type: "inspector:selected", target: buildInspectorTarget(element) });
    }
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (enabled) event.stopImmediatePropagation();
  };

  const enable = (): void => {
    if (enabled) return;
    enabled = true;
    document.body.dataset.inspectorMode = "on";
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("wheel", onWheel, { capture: true, passive: false });
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
  };

  const disable = (): void => {
    if (!enabled) return;
    enabled = false;
    delete document.body.dataset.inspectorMode;
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("wheel", onWheel, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKeyDown, true);
    hideHighlight();
    candidates = [];
    candidateIndex = -1;
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
