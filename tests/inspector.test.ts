import { describe, expect, it } from "vite-plus/test";

import {
  advanceCandidateIndex,
  buildInspectorTarget,
  createDomPath,
  isVisibleCandidateAtPoint,
  orderInspectorCandidates,
  type InspectableHtmlElement,
} from "@/src/game/inspector/domTarget";
import { isCommentModeShortcut } from "@/src/game/inspector/shortcut";

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
    return {
      x: 10.4,
      y: 20.6,
      left: 10.4,
      top: 20.6,
      right: 110.6,
      bottom: 61.4,
      width: 100.2,
      height: 40.8,
    } as DOMRect;
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

  it("pointer-events와 무관하게 좌표 안의 가시 요소를 후보로 인정한다", () => {
    const title = new FakeElement({ tag: "img" });
    const visible = { display: "block", visibility: "visible", opacity: "1" };

    expect(isVisibleCandidateAtPoint(inspectable(title), 50, 40, visible)).toBe(true);
    expect(
      isVisibleCandidateAtPoint(inspectable(title), 50, 40, {
        ...visible,
        visibility: "hidden",
      }),
    ).toBe(false);
    expect(isVisibleCandidateAtPoint(inspectable(title), 500, 400, visible)).toBe(false);
  });

  it("부모 다음에 포인터 이벤트가 없는 자식 후보를 배치한다", () => {
    const body = new FakeElement({ tag: "body" });
    const main = new FakeElement({ tag: "main", parent: body });
    const title = new FakeElement({ tag: "img", classes: ["title"], parent: main });

    const ordered = orderInspectorCandidates(
      [inspectable(main), inspectable(body), inspectable(title)],
      [inspectable(main), inspectable(body)],
    );
    expect(ordered).toEqual([inspectable(body), inspectable(main), inspectable(title)]);
    expect(advanceCandidateIndex(ordered.indexOf(inspectable(main)), 1, ordered.length)).toBe(2);
  });
});

describe("Comment Mode 단축키", () => {
  it("수정키 충돌과 키 반복 없이 Shift+V만 허용한다", () => {
    const base = {
      key: "V",
      code: "KeyV",
      shiftKey: true,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      repeat: false,
    };
    expect(isCommentModeShortcut(base)).toBe(true);
    expect(isCommentModeShortcut({ ...base, shiftKey: false })).toBe(false);
    expect(isCommentModeShortcut({ ...base, ctrlKey: true })).toBe(false);
    expect(isCommentModeShortcut({ ...base, repeat: true })).toBe(false);
  });
});
