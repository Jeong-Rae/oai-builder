import { createTutorialView, type TutorialView } from "@/src/game/scenes/tutorial/view";
import { playSfx } from "@/src/game/sfx";

export const tutorialText = {
  first: `어느 우주…
별자리를 이루던 별들이 뿔뿔이 흩어졌다.
흩어진 별들은 방향을 잃어 제자리로 돌아가지 못했고…
별자리를 잃은 우주는 점점 혼란에 빠져들었다.`,
  second: `우주를 구하기 위해 고양이 한 마리가 나섰다!!!!!

왜 고양이냐고?!
고양이는 귀여우니까!`,
  final: "야옹, 저 너머로!",
} as const;

const TYPE_INTERVAL = 55;
const BLUR_DURATION = 800;
const MASCOT_HOLD = 700;

type Phase =
  | "idle"
  | "typing-first"
  | "holding-first"
  | "blurring"
  | "typing-second"
  | "holding-mascot"
  | "typing-final"
  | "holding-final"
  | "done";

interface Typing {
  complete(): void;
}

export interface TutorialScene {
  view: HTMLElement;
  activate(): void;
  dispose(): void;
}

export function createTutorialScene(
  onComplete: () => void,
  view: TutorialView = createTutorialView(),
): TutorialScene {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let active = false;
  let disposed = false;
  let phase: Phase = "idle";
  let timer: number | undefined;
  let typing: Typing | undefined;
  let advance: (() => void) | undefined;

  const clearTimer = (): void => {
    if (timer === undefined) return;
    window.clearTimeout(timer);
    timer = undefined;
  };

  const wait = (nextPhase: Phase, duration: number, next: () => void): void => {
    phase = nextPhase;
    advance = next;
    timer = window.setTimeout(() => {
      timer = undefined;
      advance = undefined;
      next();
    }, duration);
  };

  const waitForTouch = (nextPhase: "holding-first" | "holding-final", next: () => void): void => {
    phase = nextPhase;
    advance = next;
    view.setTouchVisible(true);
  };

  const type = (
    nextPhase: Phase,
    text: string,
    update: (value: string) => void,
    finished: () => void,
  ): void => {
    phase = nextPhase;
    advance = undefined;
    view.announce(text);
    const characters = Array.from(text);
    let index = 0;

    const finish = (): void => {
      typing = undefined;
      finished();
    };
    const complete = (): void => {
      clearTimer();
      update(text);
      finish();
    };
    typing = { complete };

    if (reducedMotion) {
      complete();
      return;
    }

    const nextCharacter = (): void => {
      const character = characters[index++]!;
      update(characters.slice(0, index).join(""));
      if (!/\s/.test(character)) playSfx("typing");
      if (index >= characters.length) {
        finish();
        return;
      }
      timer = window.setTimeout(nextCharacter, TYPE_INTERVAL);
    };
    nextCharacter();
  };

  const completeTutorial = (): void => {
    phase = "done";
    advance = undefined;
    onComplete();
  };

  const typeFinal = (): void => {
    type("typing-final", tutorialText.final, view.setFinalText, () =>
      waitForTouch("holding-final", completeTutorial),
    );
  };

  const typeSecond = (): void => {
    view.setSecondLayout();
    type("typing-second", tutorialText.second, view.setStoryText, () => {
      view.showMascot();
      wait("holding-mascot", MASCOT_HOLD, typeFinal);
    });
  };

  const blurFirst = (): void => {
    phase = "blurring";
    advance = undefined;
    view.setBlurred(true);
    timer = window.setTimeout(
      () => {
        timer = undefined;
        view.clearStory();
        view.setBlurred(false);
        typeSecond();
      },
      reducedMotion ? 0 : BLUR_DURATION,
    );
  };

  const typeFirst = (): void => {
    type("typing-first", tutorialText.first, view.setStoryText, () =>
      waitForTouch("holding-first", blurFirst),
    );
  };

  const advanceNow = (): void => {
    if (!advance) return;
    clearTimer();
    if (phase === "holding-first" || phase === "holding-final") view.setTouchVisible(false);
    const next = advance;
    advance = undefined;
    next();
  };

  view.setTouchHandler(() => {
    if (phase === "holding-first" || phase === "holding-final") advanceNow();
  });

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || phase === "blurring" || phase === "done") return;
    event.preventDefault();
    if (typing) {
      typing.complete();
      return;
    }
    advanceNow();
  };

  return {
    view: view.root,
    activate() {
      if (active || disposed) return;
      active = true;
      window.addEventListener("keydown", handleKeydown);
      typeFirst();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimer();
      typing = undefined;
      advance = undefined;
      view.setTouchHandler(() => {});
      window.removeEventListener("keydown", handleKeydown);
    },
  };
}
