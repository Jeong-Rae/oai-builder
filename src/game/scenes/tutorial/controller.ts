import { createTutorialView, type TutorialView } from "@/src/game/scenes/tutorial/view";
import { playSfx } from "@/src/game/sfx";

export const tutorialSentences = {
  first: [
    "어느 우주…",
    "\n별자리를 이루던 별들이 뿔뿔이 흩어졌다.",
    "\n흩어진 별들은 방향을 잃어 제자리로 돌아가지 못했고…",
    "\n별자리를 잃은 우주는 점점 혼란에 빠져들었다.",
  ],
  second: [
    "우주를 구하기 위해 고양이 한 마리가 나섰다!!!!!",
    "\n\n왜 고양이냐고?!",
    "\n고양이는 귀여우니까!",
  ],
  final: ["야옹, 저 너머로!"],
} as const;

export const tutorialText = {
  first: tutorialSentences.first.join(""),
  second: tutorialSentences.second.join(""),
  final: tutorialSentences.final.join(""),
} as const;

const TYPE_INTERVAL = 100;
const SPACE_DELAY = 200;
const WORD_LENGTH_REDUCTION = 15;
const MIN_TYPE_INTERVAL = 60;
const BLUR_DURATION = 800;
const MASCOT_INTERVAL = 320;
const MASCOT_HOLD = 600;

type Phase = "idle" | "typing-story" | "holding-input" | "blurring" | "holding-mascot" | "done";

interface Typing {
  complete(): void;
}

export interface TutorialScene {
  view: HTMLElement;
  activate(): void;
  dispose(): void;
}

export function typingDelay(characters: readonly string[], index: number): number {
  const character = characters[index];
  if (character === " ") return TYPE_INTERVAL + SPACE_DELAY;
  if (!character || /\s/.test(character)) return TYPE_INTERVAL;

  let wordStart = index;
  let wordEnd = index;
  while (wordStart > 0 && !/\s/.test(characters[wordStart - 1]!)) wordStart -= 1;
  while (wordEnd < characters.length && !/\s/.test(characters[wordEnd]!)) wordEnd += 1;

  const wordLength = wordEnd - wordStart;
  return Math.max(MIN_TYPE_INTERVAL, TYPE_INTERVAL - (wordLength - 1) * WORD_LENGTH_REDUCTION);
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
    advance = undefined;
    timer = window.setTimeout(() => {
      timer = undefined;
      next();
    }, duration);
  };

  const waitForInput = (next: () => void): void => {
    phase = "holding-input";
    advance = next;
    view.setContinueVisible(true);
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
      timer = window.setTimeout(nextCharacter, typingDelay(characters, index - 1));
    };
    nextCharacter();
  };

  const typeSentences = (
    sentences: readonly string[],
    update: (value: string) => void,
    finished: () => void,
  ): void => {
    let sentenceIndex = 0;
    const typeNextSentence = (): void => {
      const precedingText = sentences.slice(0, sentenceIndex).join("");
      const sentence = sentences[sentenceIndex]!;
      type(
        "typing-story",
        sentence,
        (value) => update(`${precedingText}${value}`),
        () => {
          sentenceIndex += 1;
          waitForInput(sentenceIndex === sentences.length ? finished : typeNextSentence);
        },
      );
    };
    typeNextSentence();
  };

  const completeTutorial = (): void => {
    phase = "done";
    advance = undefined;
    onComplete();
  };

  const typeFinal = (): void => {
    typeSentences(tutorialSentences.final, view.setFinalText, completeTutorial);
  };

  const revealMascots = (): void => {
    phase = "holding-mascot";
    advance = typeFinal;
    if (reducedMotion) {
      [0, 1, 2].forEach(view.showMascot);
      wait("holding-mascot", MASCOT_HOLD, typeFinal);
      return;
    }

    let index = 0;
    const revealNext = (): void => {
      view.showMascot(index);
      playSfx("button");
      index += 1;
      if (index === 3) {
        wait("holding-mascot", MASCOT_HOLD, typeFinal);
        return;
      }
      timer = window.setTimeout(revealNext, MASCOT_INTERVAL);
    };
    revealNext();
  };

  const typeSecond = (): void => {
    view.setSecondLayout();
    typeSentences(tutorialSentences.second, view.setStoryText, revealMascots);
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
    typeSentences(tutorialSentences.first, view.setStoryText, blurFirst);
  };

  const advanceNow = (): void => {
    if (!advance) return;
    clearTimer();
    if (phase === "holding-input") view.setContinueVisible(false);
    const next = advance;
    advance = undefined;
    next();
  };

  view.setContinueHandler(() => {
    if (phase === "holding-input") advanceNow();
  });

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || phase === "blurring" || phase === "done") return;
    event.preventDefault();
    if (typing) {
      typing.complete();
      return;
    }
    if (phase === "holding-input") advanceNow();
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
      view.setContinueHandler(() => {});
      window.removeEventListener("keydown", handleKeydown);
    },
  };
}
