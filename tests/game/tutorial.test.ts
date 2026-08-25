import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/src/game/scenes/tutorial/view", () => ({ createTutorialView: vi.fn() }));
vi.mock("@/src/game/sfx", () => ({ playSfx: vi.fn() }));

import {
  createTutorialScene,
  tutorialSentences,
  tutorialText,
  typingDelay,
} from "@/src/game/scenes/tutorial/controller";
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
    vi.clearAllMocks();
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

  it("각 문장이 끝날 때마다 화면 입력을 기다린 뒤 완료한다", () => {
    const view = tutorialView();
    const onComplete = vi.fn();
    const scene = createTutorialScene(onComplete, view);

    scene.activate();
    for (let index = 0; index < 7; index += 1) {
      vi.runAllTimers();
      expect(view.setContinueVisible).toHaveBeenLastCalledWith(true);
      view.clickScreen();
    }
    vi.runAllTimers();
    expect(onComplete).not.toHaveBeenCalled();
    expect(view.setContinueVisible).toHaveBeenLastCalledWith(true);
    view.clickScreen();

    expect(view.announce.mock.calls.map(([text]) => text)).toEqual([
      ...tutorialSentences.first,
      ...tutorialSentences.second,
      ...tutorialSentences.final,
    ]);
    expect(view.setBlurred.mock.calls).toEqual([[true], [false]]);
    expect(view.clearStory).toHaveBeenCalledOnce();
    expect(view.setSecondLayout).toHaveBeenCalledOnce();
    expect(view.showMascot.mock.calls).toEqual([[0], [1], [2]]);
    expect(view.setStoryText).toHaveBeenLastCalledWith(tutorialText.second);
    expect(view.setFinalText).toHaveBeenLastCalledWith(tutorialText.final);
    expect(view.setContinueVisible.mock.calls).toEqual(
      Array.from({ length: 8 }, () => [[true], [false]]).flat(),
    );
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

  it("화면 터치, Enter, 오른쪽 방향키로 현재 문장을 완성하거나 다음 문장으로 넘어간다", () => {
    const view = tutorialView();
    const onComplete = vi.fn();
    const scene = createTutorialScene(onComplete, view);
    scene.activate();
    const keydown = listeners.get("keydown")! as (event: KeyboardEvent) => void;
    const key = (value: "Enter" | "ArrowRight") =>
      keydown({ key: value, preventDefault: vi.fn() } as unknown as KeyboardEvent);

    view.clickScreen();
    expect(view.setStoryText).toHaveBeenLastCalledWith(tutorialSentences.first[0]);
    expect(view.setContinueVisible).toHaveBeenLastCalledWith(true);
    expect(view.setBlurred).not.toHaveBeenCalled();
    key("ArrowRight");
    expect(view.setContinueVisible).toHaveBeenLastCalledWith(false);
    key("Enter");
    expect(view.setStoryText).toHaveBeenLastCalledWith(
      tutorialSentences.first.slice(0, 2).join(""),
    );
    expect(view.setBlurred).not.toHaveBeenCalled();
  });

  it("단어가 길수록 더 빠르게 입력하고 공백 뒤에는 추가로 기다린다", () => {
    const characters = Array.from("가 나나나나 아주아주아주아주");
    const noJitter = () => 0.5;

    expect(typingDelay(characters, 0, noJitter)).toBe(100);
    expect(typingDelay(characters, 1, noJitter)).toBe(300);
    expect(typingDelay(characters, 2, noJitter)).toBe(60);
    expect(typingDelay(characters, 7, noJitter)).toBe(60);
  });

  it("글자마다 ±15ms 범위의 지터를 적용하고 공백의 대기 시간은 유지한다", () => {
    const characters = Array.from("가 나");

    expect(typingDelay(characters, 0, () => 0)).toBe(85);
    expect(typingDelay(characters, 0, () => 1)).toBe(115);
    expect(typingDelay(characters, 1, () => 0)).toBe(300);
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
