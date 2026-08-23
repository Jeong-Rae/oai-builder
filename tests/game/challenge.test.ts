import { describe, expect, it } from "vite-plus/test";

import type { BrowserStorage } from "@/src/game/auth";
import { dailyChallenge, FakeChallengeServer, formatDuration } from "@/src/game/challenge";

function memoryStorage(): BrowserStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe("일일 챌린지", () => {
  it("한국 날짜가 바뀌면 hard 맵을 교대한다", () => {
    const beforeMidnight = dailyChallenge(new Date("2026-08-23T14:59:59Z"));
    const afterMidnight = dailyChallenge(new Date("2026-08-23T15:00:00Z"));

    expect(beforeMidnight.date).toBe("2026-08-23");
    expect(afterMidnight.date).toBe("2026-08-24");
    expect(beforeMidnight.mapUrl).not.toBe(afterMidnight.mapUrl);
  });

  it("같은 날에는 플레이어의 가장 빠른 기록만 유지한다", async () => {
    const server = new FakeChallengeServer(memoryStorage());
    const player = { playerId: "local:player", displayName: "도전자-TEST" };

    await server.submitResult("daily:2026-08-23", player, 40_000);
    const slower = await server.submitResult("daily:2026-08-23", player, 80_000);

    expect(slower.attemptMs).toBe(80_000);
    expect(slower.bestMs).toBe(40_000);
    expect(slower.currentPlayer.rank).toBe(1);
    expect(slower.topThree[0]?.playerId).toBe(player.playerId);
  });

  it("상위 3명 밖의 현재 플레이어 순위를 반환한다", async () => {
    const result = await new FakeChallengeServer(memoryStorage()).submitResult(
      "daily:2026-08-23",
      { playerId: "local:player", displayName: "도전자-TEST" },
      100_000,
    );

    expect(result.topThree).toHaveLength(3);
    expect(result.currentPlayer.rank).toBe(5);
  });

  it("밀리초 기록을 분과 초 형식으로 표시한다", () => {
    expect(formatDuration(61_007)).toBe("01:01.007");
  });
});
