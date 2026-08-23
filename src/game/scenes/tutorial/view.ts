import { backgroundUrl, startAssets } from "@/src/game/assets";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import styles from "@/src/game/scenes/tutorial/scene.module.css";

export interface TutorialView {
  root: HTMLElement;
  announce(text: string): void;
  clearStory(): void;
  setBlurred(blurred: boolean): void;
  setFinalText(text: string): void;
  setSecondLayout(): void;
  setStoryText(text: string): void;
  setContinueHandler(handler: () => void): void;
  setContinueVisible(visible: boolean): void;
  showMascot(): void;
}

export function createTutorialView(): TutorialView {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;

  const story = document.createElement("p");
  story.className = styles.story;
  story.setAttribute("aria-hidden", "true");

  const mascot = document.createElement("img");
  mascot.className = styles.mascot;
  mascot.src = startAssets.mascots[Math.floor(Math.random() * startAssets.mascots.length)]!;
  mascot.alt = "";

  const finalLine = document.createElement("p");
  finalLine.className = styles.finalLine;
  finalLine.setAttribute("aria-hidden", "true");

  const narration = document.createElement("p");
  narration.className = styles.screenReaderOnly;
  narration.setAttribute("aria-live", "polite");
  narration.setAttribute("aria-atomic", "true");

  const prompt = document.createElement("p");
  prompt.className = styles.prompt;
  prompt.textContent = "화면을 누르거나, enter를 눌러주세요";
  prompt.setAttribute("aria-live", "polite");
  prompt.hidden = true;

  root.append(createBackgroundStars(), story, mascot, finalLine, narration, prompt);

  return {
    root,
    announce(text) {
      narration.textContent = text;
    },
    clearStory() {
      story.textContent = "";
    },
    setBlurred(blurred) {
      story.classList.toggle(styles.blurred, blurred);
    },
    setFinalText(text) {
      finalLine.textContent = text;
    },
    setSecondLayout() {
      root.classList.add(styles.second);
    },
    setStoryText(text) {
      story.textContent = text;
    },
    setContinueHandler(handler) {
      root.onclick = handler;
    },
    setContinueVisible(visible) {
      prompt.hidden = !visible;
    },
    showMascot() {
      mascot.classList.add(styles.visible);
    },
  };
}
