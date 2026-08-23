import type { ChallengeLeaderboard } from "@/src/game/challenge";
import { createChallengeResultView } from "@/src/game/scenes/challenge-result/view";

export function createChallengeResultScene(
  date: string,
  playerId: string,
  leaderboard: ChallengeLeaderboard | undefined,
  onHome: () => void,
): { view: HTMLElement; dispose(): void } {
  const keydown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === "Escape") onHome();
  };
  window.addEventListener("keydown", keydown);
  return {
    view: createChallengeResultView(date, playerId, leaderboard, onHome),
    dispose: () => window.removeEventListener("keydown", keydown),
  };
}
