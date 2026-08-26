import { describe, expect, it } from "vite-plus/test";

import {
  advanceCandidateIndex,
  buildInspectorTarget,
  createDomPath,
  type InspectableHtmlElement,
} from "@/src/game/inspector/domTarget";

interface FakeElementOptions {
  tag: string;
  id?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  dataset?: Record<string, string>;
  text?: string;
  parent?: FakeElement;
}

class FakeElement {
  readonly tagName: string;
  readonly id: string;
  readonly classList: string[];
  readonly dataset: Record<string, string>;
  readonly children: FakeElement[] = [];
  readonly textContent: string;
  readonly parentElement: FakeElement | null;
  private readonly attributes: Record<string, string>;

  constructor(options: FakeElementOptions) {
    this.tagName = options.tag.toUpperCase();
    this.id = options.id ?? "";
    this.classList = options.classes ?? [];
    this.dataset = options.dataset ?? {};
    this.textContent = options.text ?? "";
    this.parentElement = options.parent ?? null;
    this.attributes = { ...options.attributes };
    if (this.id) this.attributes.id = this.id;
    if (this.classList.length > 0) this.attributes.class = this.classList.join(" ");
    options.parent?.children.push(this);
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] ?? null;
  }

  getBoundingClientRect(): DOMRect {
    return { x: 10.4, y: 20.6, width: 100.2, height: 40.8 } as DOMRect;
  }
}

function inspectable(element: FakeElement): InspectableHtmlElement {
  return element as unknown as InspectableHtmlElement;
}

describe("Inspector DOM fallback", () => {
  it("data-inspector metadata가 없으면 고유 DOM 경로를 target id로 사용한다", () => {
    const body = new FakeElement({ tag: "body" });
    const main = new FakeElement({ tag: "main", id: "game", parent: body });
    const first = new FakeElement({ tag: "button", classes: ["action"], parent: main });
    const second = new FakeElement({
      tag: "button",
      classes: ["action"],
      text: "Start game",
      parent: main,
    });

    expect(createDomPath(inspectable(first))).toBe("main#game > button.action:nth-of-type(1)");
    const target = buildInspectorTarget(inspectable(second));
    expect(target.id).toBe("dom:main#game > button.action:nth-of-type(2)");
    expect(target.label).toBe("Start game");
    expect(target.bounds).toEqual({ x: 10, y: 21, width: 100, height: 41 });
    expect(target.runtime).toMatchObject({
      selector: "main#game > button.action:nth-of-type(2)",
      tagName: "button",
    });
  });

  it("명시적 inspector metadata는 fallback보다 우선한다", () => {
    const element = new FakeElement({
      tag: "button",
      text: "Fallback",
      dataset: {
        inspectorId: "start-button",
        inspectorKind: "game-object",
        inspectorLabel: "START",
        inspectorSourceFile: "src/start.ts",
        inspectorSourceSymbol: "StartButton",
      },
    });

    expect(buildInspectorTarget(inspectable(element))).toMatchObject({
      id: "start-button",
      kind: "game-object",
      label: "START",
      source: { file: "src/start.ts", symbol: "StartButton" },
    });
    expect(buildInspectorTarget(inspectable(element)).runtime).toBeUndefined();
  });
});

describe("Inspector 후보 순환", () => {
  it("휠 방향으로 이동하고 양 끝에서 순환한다", () => {
    expect(advanceCandidateIndex(0, 1, 3)).toBe(1);
    expect(advanceCandidateIndex(2, 1, 3)).toBe(0);
    expect(advanceCandidateIndex(0, -1, 3)).toBe(2);
    expect(advanceCandidateIndex(1, 0, 3)).toBe(1);
    expect(advanceCandidateIndex(-1, 1, 0)).toBe(-1);
  });
});
