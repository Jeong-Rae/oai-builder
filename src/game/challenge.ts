import type { BrowserStorage, PlayerId } from "@/src/game/auth";

export interface DailyChallenge {
  id: string;
  date: string;
  mapUrl: string;
}

export interface ChallengeEntry {
  rank: number;
  playerId: PlayerId;
  displayName: string;
  durationMs: number;
}

export interface ChallengeLeaderboard {
  topThree: ChallengeEntry[];
  currentPlayer: ChallengeEntry;
  attemptMs: number;
  bestMs: number;
}

export interface ChallengeGateway {
  submitResult(
    challengeId: string,
    player: { playerId: PlayerId; displayName: string },
    durationMs: number,
  ): Promise<ChallengeLeaderboard>;
}

const hardMaps = [
  new URL("@/maps/map_hard.map", import.meta.url).href,
  new URL("@/maps/map_hard2.map", import.meta.url).href,
] as const;

const fakePlayers = [
  ["sample:starlight", "별빛고양이", 45_000],
  ["sample:moon", "달토끼", 60_000],
  ["sample:galaxy", "은하수", 75_000],
  ["sample:fullmoon", "보름달", 90_000],
  ["sample:meteor", "유성먼지", 120_000],
] as const;

const storageKey = "challenge.leaderboards.v1";

interface StoredRecord {
  displayName: string;
  durationMs: number;
}

interface StoredLeaderboards {
  version: 1;
  records: Record<string, Record<PlayerId, StoredRecord>>;
}

export function dailyChallenge(now = new Date()): DailyChallenge {
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const day = Math.floor(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / 86_400_000,
  );
  return { id: `daily:${date}`, date, mapUrl: hardMaps[Math.abs(day) % hardMaps.length]! };
}

export function formatDuration(durationMs: number): string {
  const value = Math.max(0, Math.floor(durationMs));
  const minutes = Math.floor(value / 60_000);
  const seconds = Math.floor((value % 60_000) / 1_000);
  const milliseconds = value % 1_000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

export class FakeChallengeServer implements ChallengeGateway {
  constructor(private readonly storage: BrowserStorage) {}

  async submitResult(
    challengeId: string,
    player: { playerId: PlayerId; displayName: string },
    durationMs: number,
  ): Promise<ChallengeLeaderboard> {
    if (!Number.isFinite(durationMs) || durationMs < 0)
      throw new Error("잘못된 챌린지 기록입니다.");
    const attemptMs = Math.floor(durationMs);
    const leaderboards = this.read();
    const records = (leaderboards.records[challengeId] ??= {});
    const previous = records[player.playerId];
    if (!previous || attemptMs < previous.durationMs) {
      records[player.playerId] = { displayName: player.displayName, durationMs: attemptMs };
      this.storage.setItem(storageKey, JSON.stringify(leaderboards));
    }

    const entries = [
      ...fakePlayers.map(([playerId, displayName, sampleDuration]) => ({
        playerId,
        displayName,
        durationMs: sampleDuration,
      })),
      ...Object.entries(records).map(([playerId, record]) => ({ playerId, ...record })),
    ]
      .sort(
        (left, right) =>
          left.durationMs - right.durationMs || left.playerId.localeCompare(right.playerId),
      )
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
    const currentPlayer = entries.find((entry) => entry.playerId === player.playerId)!;
    return {
      topThree: entries.slice(0, 3),
      currentPlayer,
      attemptMs,
      bestMs: currentPlayer.durationMs,
    };
  }

  private read(): StoredLeaderboards {
    const source = this.storage.getItem(storageKey);
    if (source === null) return { version: 1, records: {} };
    const parsed: unknown = JSON.parse(source);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      parsed.version !== 1 ||
      !("records" in parsed) ||
      typeof parsed.records !== "object" ||
      parsed.records === null
    )
      throw new Error("챌린지 리더보드가 손상되었습니다.");
    const valid = Object.values(parsed.records).every(
      (leaderboard) =>
        typeof leaderboard === "object" &&
        leaderboard !== null &&
        Object.values(leaderboard).every(
          (record) =>
            typeof record === "object" &&
            record !== null &&
            "displayName" in record &&
            typeof record.displayName === "string" &&
            "durationMs" in record &&
            typeof record.durationMs === "number" &&
            Number.isFinite(record.durationMs) &&
            record.durationMs >= 0,
        ),
    );
    if (!valid) throw new Error("챌린지 리더보드가 손상되었습니다.");
    return parsed as StoredLeaderboards;
  }
}
