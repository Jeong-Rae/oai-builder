import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/src/game/scenes/tutorial/view", () => ({ createTutorialView: vi.fn() }));
vi.mock("@/src/game/sfx", () => ({ playSfx: vi.fn() }));

import { createTutorialScene, tutorialText } from "@/src/game/scenes/tutorial/controller";
import { playSfx } from "@/src/game/sfx";

const mockedPlaySfx = vi.mocked(playSfx);

function tutorialView() {
  let continueHandler = () => {};
  return {
    root: {} as HTMLElement,
    announce: vi.fn<(text: string) => void>(),
    clearStory: vi.fn<() => void>(),
    setBlurred: vi.fn<(blurred: boolean) => void>(),
    setFinalText: vi.fn<(text: string) => void>(),
    setSecondLayout: vi.fn<() => void>(),
    setStoryText: vi.fn<(text: string) => void>(),
    setContinueHandler: vi.fn<(handler: () => void) => void>((handler) => {
      continueHandler = handler;
    }),
    setContinueVisible: vi.fn<(visible: boolean) => void>(),
    showMascot: vi.fn<(index: number) => void>(),
    clickScreen: () => continueHandler(),
  };
}

describe("최초 실행 튜토리얼", () => {
  const listeners = new Map<string, EventListener>();

  beforeEach(() => {
    vi.useFakeTimers();
    listeners.clear();
    vi.stubGlobal("window", {
      addEventListener: vi.fn((type: string, listener: EventListener) =>
        listeners.set(type, listener),
      ),
      clearTimeout,
      matchMedia: () => ({ matches: false }),
      removeEventListener: vi.fn((type: string) => listeners.delete(type)),
      setTimeout,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("두 안내 지점에서 화면 입력을 기다린 뒤 완료한다", () => {
    const view = tutorialView();
    const onComplete = vi.fn();
    const scene = createTutorialScene(onComplete, view);

    scene.activate();
    vi.runAllTimers();
    expect(onComplete).not.toHaveBeenCalled();
    expect(view.setContinueVisible).toHaveBeenLastCalledWith(true);

    view.clickScreen();
    vi.runAllTimers();
    expect(onComplete).not.toHaveBeenCalled();
    expect(view.setContinueVisible).toHaveBeenLastCalledWith(true);

    view.clickScreen();

    expect(view.announce.mock.calls.map(([text]) => text)).toEqual([
      tutorialText.first,
      tutorialText.second,
      tutorialText.final,
    ]);
    expect(view.setBlurred.mock.calls).toEqual([[true], [false]]);
    expect(view.clearStory).toHaveBeenCalledOnce();
    expect(view.setSecondLayout).toHaveBeenCalledOnce();
    expect(view.showMascot.mock.calls).toEqual([[0], [1], [2]]);
    expect(view.setStoryText).toHaveBeenLastCalledWith(tutorialText.second);
    expect(view.setFinalText).toHaveBeenLastCalledWith(tutorialText.final);
    expect(view.setContinueVisible.mock.calls).toEqual([[true], [false], [true], [false]]);
    expect(mockedPlaySfx.mock.calls.filter(([name]) => name === "typing")).toHaveLength(
      Array.from(Object.values(tutorialText).join("")).filter((character) => !/\s/.test(character))
        .length,
    );
    expect(mockedPlaySfx.mock.calls.filter(([name]) => name === "button")).toEqual([
      ["button"],
      ["button"],
      ["button"],
    ]);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("Enter를 한 번 누르면 현재 타이핑을 완성하고 다시 누르면 다음 구간으로 간다", () => {
    const view = tutorialView();
    const onComplete = vi.fn();
    const scene = createTutorialScene(onComplete, view);
    scene.activate();
    const keydown = listeners.get("keydown")! as (event: KeyboardEvent) => void;
    const enter = () =>
      keydown({ key: "Enter", preventDefault: vi.fn() } as unknown as KeyboardEvent);

    enter();
    expect(view.setStoryText).toHaveBeenLastCalledWith(tutorialText.first);
    expect(view.setContinueVisible).toHaveBeenLastCalledWith(true);
    expect(view.setBlurred).not.toHaveBeenCalled();
    enter();
    expect(view.setContinueVisible).toHaveBeenLastCalledWith(false);
    expect(view.setBlurred).toHaveBeenCalledWith(true);

    vi.advanceTimersByTime(800);
    enter();
    expect(view.setStoryText).toHaveBeenLastCalledWith(tutorialText.second);
    expect(view.showMascot).toHaveBeenCalledExactlyOnceWith(0);
    enter();
    enter();
    expect(view.setFinalText).toHaveBeenLastCalledWith(tutorialText.final);
    expect(onComplete).not.toHaveBeenCalled();
    enter();
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("장면을 폐기하면 예약 작업과 키보드 입력을 제거한다", () => {
    const view = tutorialView();
    const onComplete = vi.fn();
    const scene = createTutorialScene(onComplete, view);
    scene.activate();

    scene.dispose();
    vi.runAllTimers();

    expect(listeners.has("keydown")).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
