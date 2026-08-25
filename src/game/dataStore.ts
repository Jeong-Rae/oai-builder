import type { BrowserStorage, PlayerId } from "@/src/game/auth";

export interface GameDataStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export class FakeGameDataServer implements GameDataStore {
  constructor(
    private readonly storage: BrowserStorage,
    private readonly playerId: PlayerId,
  ) {}

  async get(key: string): Promise<string | null> {
    return this.storage.getItem(this.key(key));
  }

  async set(key: string, value: string): Promise<void> {
    this.storage.setItem(this.key(key), value);
  }

  async remove(key: string): Promise<void> {
    this.storage.removeItem(this.key(key));
  }

  private key(key: string): string {
    return `players/${this.playerId}/${key}`;
  }
}

export { FakeGameDataServer as LocalGameDataStore };
