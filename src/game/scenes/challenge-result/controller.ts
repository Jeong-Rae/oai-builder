import type { ChallengeLeaderboard } from "@/src/game/challenge";
import { createChallengeResultView } from "@/src/game/scenes/challenge-result/view";

export interface ChallengeResultScene {
  view: HTMLElement;
  activate(): void;
  setLeaderboard(leaderboard: ChallengeLeaderboard | undefined): void;
  dispose(): void;
}

export function createChallengeResultScene(
  date: string,
  playerId: string,
  onHome: () => void,
): ChallengeResultScene {
  const result = createChallengeResultView(date, playerId, onHome);
  let active = false;
  const keydown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === "Escape") onHome();
  };
  return {
    view: result.root,
    activate() {
      if (active) return;
      active = true;
      window.addEventListener("keydown", keydown);
    },
    setLeaderboard: result.setLeaderboard,
    dispose() {
      active = false;
      window.removeEventListener("keydown", keydown);
    },
  };
}
