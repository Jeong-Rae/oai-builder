export type PlayerId = string;
export type AuthProvider = "GOOGLE";
export type AuthEnvironment = "LOCAL_DEMO" | "HIVE";

export interface AuthSession {
  playerId: PlayerId;
  displayName: string;
  provider: AuthProvider;
  environment: AuthEnvironment;
}

export interface GameSession {
  playerId: PlayerId;
  displayName: string;
}

export interface AuthGateway {
  signIn(provider: AuthProvider): Promise<AuthSession>;
  restore(): Promise<AuthSession | null>;
  signOut(): Promise<void>;
}

export interface BrowserStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PlayerRegistry {
  installationId: string;
  playerId: PlayerId;
  displayName?: string;
  createdAt: string;
}

export const INSTALLATION_ID_KEY = "game.installation-id";
export const PLAYER_REGISTRY_KEY = "game.player-registry";

export function anonymousDisplayName(playerId: PlayerId): string {
  const suffix = playerId
    .replace(/[^a-z0-9]/gi, "")
    .slice(-4)
    .toUpperCase()
    .padStart(4, "0");
  return `도전자-${suffix}`;
}

function parseRegistry(raw: string): PlayerRegistry {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Local Player 정보가 손상되었습니다.");
  }

  if (
    typeof value !== "object" ||
    value === null ||
    !("installationId" in value) ||
    typeof value.installationId !== "string" ||
    !("playerId" in value) ||
    typeof value.playerId !== "string" ||
    !value.playerId.startsWith("local:") ||
    !("createdAt" in value) ||
    typeof value.createdAt !== "string"
  ) {
    throw new Error("Local Player 정보가 손상되었습니다.");
  }

  return value as PlayerRegistry;
}

export class LocalAuthAdapter implements AuthGateway {
  constructor(
    private readonly storage: BrowserStorage,
    private readonly createId: () => string = () => crypto.randomUUID(),
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async signIn(provider: AuthProvider): Promise<AuthSession> {
    let installationId = this.storage.getItem(INSTALLATION_ID_KEY);
    if (installationId === null) {
      installationId = this.createId();
      this.storage.setItem(INSTALLATION_ID_KEY, installationId);
    }

    const rawRegistry = this.storage.getItem(PLAYER_REGISTRY_KEY);
    let registry: PlayerRegistry;
    if (rawRegistry === null) {
      registry = {
        installationId,
        playerId: `local:${this.createId()}`,
        createdAt: this.now(),
      };
      registry.displayName = anonymousDisplayName(registry.playerId);
      this.storage.setItem(PLAYER_REGISTRY_KEY, JSON.stringify(registry));
    } else {
      registry = parseRegistry(rawRegistry);
      if (registry.installationId !== installationId) {
        throw new Error("Local Player 정보가 현재 브라우저와 일치하지 않습니다.");
      }
    }

    return {
      playerId: registry.playerId,
      displayName: registry.displayName ?? anonymousDisplayName(registry.playerId),
      provider,
      environment: "LOCAL_DEMO",
    };
  }

  async restore(): Promise<AuthSession | null> {
    const installationId = this.storage.getItem(INSTALLATION_ID_KEY);
    if (installationId === null) return null;

    const rawRegistry = this.storage.getItem(PLAYER_REGISTRY_KEY);
    if (rawRegistry === null) return null;

    const registry = parseRegistry(rawRegistry);
    if (registry.installationId !== installationId) {
      throw new Error("Local Player 정보가 현재 브라우저와 일치하지 않습니다.");
    }

    return {
      playerId: registry.playerId,
      displayName: registry.displayName ?? anonymousDisplayName(registry.playerId),
      provider: "GOOGLE",
      environment: "LOCAL_DEMO",
    };
  }

  async signOut(): Promise<void> {}
}
