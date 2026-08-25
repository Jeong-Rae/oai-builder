import { backgroundUrl, challengeDecorAssets, starNodeAssets } from "@/src/game/assets";
import {
  formatDuration,
  type ChallengeEntry,
  type ChallengeLeaderboard,
} from "@/src/game/challenge";
import { createBackButton } from "@/src/game/components/BackButton";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import styles from "@/src/game/scenes/challenge-result/scene.module.css";

export function createChallengeResultView(
  date: string,
  playerId: string,
  onHome: () => void,
): { root: HTMLElement; setLeaderboard(leaderboard: ChallengeLeaderboard | undefined): void } {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  root.append(createBackgroundStars());
  const panel = document.createElement("section");
  panel.className = styles.panel;
  panel.style.backgroundImage = `url(${challengeDecorAssets.board})`;
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "challenge-result-title");
  panel.setAttribute("role", "dialog");
  panel.append(...createCornerStars());
  const eyebrow = document.createElement("p");
  eyebrow.className = styles.eyebrow;
  eyebrow.textContent = `${date} · DAILY CHALLENGE`;
  const title = document.createElement("h1");
  title.id = "challenge-result-title";
  title.className = styles.title;
  title.textContent = "LEADERBOARD";
  panel.append(eyebrow, title);
  const content = document.createElement("div");
  panel.append(content);
  root.append(panel, createBackButton("챕터 선택으로 돌아가기", onHome));
  root.addEventListener("click", (event) => {
    if (!(event.target instanceof Node) || panel.contains(event.target)) return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    onHome();
  });
  return {
    root,
    setLeaderboard(leaderboard) {
      content.replaceChildren();
      if (leaderboard) {
        title.textContent = "LEADERBOARD";
        content.append(createSummary(leaderboard), createRanking(leaderboard, playerId));
        return;
      }
      title.textContent = "기록을 저장하지 못했습니다";
      const error = document.createElement("p");
      error.className = styles.error;
      error.setAttribute("role", "alert");
      error.textContent = "브라우저 저장소를 확인한 뒤 다음 챌린지에서 다시 시도해 주세요.";
      content.append(error);
    },
  };
}

function createCornerStars(): HTMLImageElement[] {
  return ["topLeft", "topRight", "bottomLeft", "bottomRight"].map((corner) => {
    const star = document.createElement("img");
    star.className = `${styles.cornerStar} ${styles[corner]!}`;
    star.src = challengeDecorAssets.plus;
    star.alt = "";
    return star;
  });
}

function createSummary(leaderboard: ChallengeLeaderboard): HTMLElement {
  const summary = document.createElement("dl");
  summary.className = styles.summary;
  [
    ["이번 기록", leaderboard.attemptMs],
    ["최고 기록", leaderboard.bestMs],
  ].forEach(([label, duration]) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = String(label);
    const value = document.createElement("dd");
    value.textContent = formatDuration(Number(duration));
    item.append(term, value);
    summary.append(item);
  });
  return summary;
}

function createRanking(leaderboard: ChallengeLeaderboard, playerId: string): HTMLElement {
  const ranking = document.createElement("div");
  ranking.className = styles.ranking;
  ranking.style.setProperty("--ranking-rule", `url(${challengeDecorAssets.rule})`);
  const list = document.createElement("ol");
  list.className = styles.list;
  leaderboard.topThree.forEach((entry) => list.append(createEntry(entry, playerId)));
  ranking.append(list);
  if (leaderboard.currentPlayer.rank > 3) {
    const divider = document.createElement("div");
    divider.className = styles.divider;
    divider.setAttribute("aria-hidden", "true");
    const current = document.createElement("ol");
    current.className = styles.list;
    current.append(createEntry(leaderboard.currentPlayer, playerId));
    ranking.append(divider, current);
  }
  return ranking;
}

function createEntry(entry: ChallengeEntry, playerId: string): HTMLLIElement {
  const own = entry.playerId === playerId;
  const row = document.createElement("li");
  row.className = `${styles.row} ${own ? styles.own : ""}`;
  if (own) row.style.setProperty("--record-row", `url(${challengeDecorAssets.recordRow})`);
  row.value = entry.rank;
  const rank = document.createElement("span");
  rank.className = styles.rank;
  rank.textContent = String(entry.rank).padStart(2, "0");
  const star = document.createElement("img");
  star.className = styles.star;
  star.src = own ? starNodeAssets.gold : starNodeAssets.white;
  star.alt = "";
  const name = document.createElement("span");
  name.className = styles.name;
  name.textContent = entry.displayName;
  const duration = document.createElement("time");
  duration.className = styles.duration;
  duration.textContent = formatDuration(entry.durationMs);
  row.append(rank, star, name, duration);
  return row;
}
