import { describe, expect, it } from "vite-plus/test";

import {
  INSTALLATION_ID_KEY,
  LocalAuthAdapter,
  PLAYER_REGISTRY_KEY,
  type BrowserStorage,
} from "@/src/game/auth";
import { LocalGameDataStore } from "@/src/game/dataStore";

function memoryStorage(): BrowserStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe("Local Login", () => {
  it("최초 로그인 후 같은 Local Player를 복구한다", async () => {
    const storage = memoryStorage();
    const ids = ["installation-id", "player-id"];
    const auth = new LocalAuthAdapter(
      storage,
      () => ids.shift()!,
      () => "2026-08-23T06:30:00Z",
    );

    const signedIn = await auth.signIn("GOOGLE");
    const restored = await auth.restore();

    expect(storage.data.get(INSTALLATION_ID_KEY)).toBe("installation-id");
    expect(JSON.parse(storage.data.get(PLAYER_REGISTRY_KEY)!)).toEqual({
      installationId: "installation-id",
      playerId: "local:player-id",
      createdAt: "2026-08-23T06:30:00Z",
    });
    expect(restored).toEqual(signedIn);
  });

  it("손상된 Player Registry를 임의로 복구하지 않는다", async () => {
    const storage = memoryStorage();
    storage.data.set(INSTALLATION_ID_KEY, "installation-id");
    storage.data.set(PLAYER_REGISTRY_KEY, "not-json");

    await expect(new LocalAuthAdapter(storage).restore()).rejects.toThrow(
      "Local Player 정보가 손상되었습니다.",
    );
  });

  it("PlayerId별로 게임 데이터를 격리한다", async () => {
    const storage = memoryStorage();
    const firstPlayer = new LocalGameDataStore(storage, "local:first");
    const secondPlayer = new LocalGameDataStore(storage, "local:second");

    await firstPlayer.set("progress", '{"stage":1}');
    await secondPlayer.set("progress", '{"stage":4}');

    expect(await firstPlayer.get("progress")).toBe('{"stage":1}');
    expect(await secondPlayer.get("progress")).toBe('{"stage":4}');
    expect(storage.data.has("players/local:first/progress")).toBe(true);
    expect(storage.data.has("players/local:second/progress")).toBe(true);
  });
});
