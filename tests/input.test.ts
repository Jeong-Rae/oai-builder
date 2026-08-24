import { describe, expect, it } from "vite-plus/test";

import { directionFromKey, isUndoShortcut } from "../src/game/input";

describe("방향키 입력", () => {
  it.each([
    ["위쪽 방향키", "ArrowUp", "up"],
    ["아래쪽 방향키", "ArrowDown", "down"],
    ["왼쪽 방향키", "ArrowLeft", "left"],
    ["오른쪽 방향키", "ArrowRight", "right"],
    ["W 키", "w", "up"],
    ["S 키", "S", "down"],
    ["A 키", "a", "left"],
    ["D 키", "D", "right"],
  ])("%s는 해당 방향 이동 명령으로 해석된다", (_, key, direction) => {
    expect(directionFromKey(key)).toBe(direction);
  });

  it("방향키가 아닌 입력은 이동 명령으로 해석되지 않는다", () => {
    expect(directionFromKey("Enter")).toBeUndefined();
  });

  it.each([
    ["Ctrl+Z", { key: "z", ctrlKey: true, metaKey: false, altKey: false }],
    ["⌘Z", { key: "z", ctrlKey: false, metaKey: true, altKey: false }],
  ])("%s는 되돌리기 단축키다", (_, event) => {
    expect(isUndoShortcut(event)).toBe(true);
  });

  it("수정 키 없이 Z를 누르거나 Alt+Z를 누르면 되돌리지 않는다", () => {
    expect(isUndoShortcut({ key: "z", ctrlKey: false, metaKey: false, altKey: false })).toBe(false);
    expect(isUndoShortcut({ key: "z", ctrlKey: true, metaKey: false, altKey: true })).toBe(false);
  });
});
