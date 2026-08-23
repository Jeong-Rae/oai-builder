import { allGameAssetUrls } from "@/src/game/assets";
import {
  type BrowserStorage,
  LocalAuthAdapter,
  type AuthGateway,
  type AuthSession,
  type GameSession,
} from "@/src/game/auth";
import { LocalGameDataStore } from "@/src/game/dataStore";
import { preloadAssets } from "@/src/game/preload";
import { createChapterScene } from "@/src/game/scenes/chapter/controller";
import { createClearScene } from "@/src/game/scenes/clear/controller";
import { createGameScene } from "@/src/game/scenes/game/controller";
import { createLoginScene } from "@/src/game/scenes/login/controller";
import { createStageSelectScene } from "@/src/game/scenes/stage-select/controller";
import { createStartScene } from "@/src/game/scenes/start/controller";
import { nextSelection, type PlaySelection } from "@/src/game/stages";
import {
  initializeProgressStore,
  progressStore,
} from "@/src/game/store/progressStore";

export class GameApp {
  private disposeScene?: () => void;
  private frame?: HTMLElement;
  private preloadPromise?: Promise<void>;
  private authGateway?: AuthGateway;
  private storage?: BrowserStorage;
  private readonly initialStartScene: ReturnType<typeof createStartScene>;
  private session?: GameSession;

  constructor(private readonly root: HTMLElement) {
    if (import.meta.env.DEV) document.addEventListener("keydown", this.handleDevShortcut);
    this.initialStartScene = createStartScene(this.showGroups);
    this.preloadPromise = preloadAssets(
      allGameAssetUrls(),
      this.initialStartScene.updateLoading,
    );
    try {
      this.storage = window.localStorage;
      this.authGateway = new LocalAuthAdapter(this.storage);
    } catch {
      this.showLogin("브라우저 저장소에 접근할 수 없습니다. 저장소 설정을 확인해 주세요.");
      return;
    }
    void this.restoreSession();
  }

  private restoreSession = async (): Promise<void> => {
    try {
      if (!this.authGateway) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
      const authSession = await this.authGateway.restore();
      if (authSession === null) {
        this.showLogin();
        return;
      }
      await this.enterGame(authSession);
    } catch {
      this.showLogin("저장된 로그인 정보를 읽지 못했습니다. 브라우저 저장소를 확인해 주세요.");
    }
  };

  private showLogin(error?: string): void {
    this.mount(createLoginScene(this.signIn, error));
  }

  private signIn = async (): Promise<void> => {
    if (!this.authGateway) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
    const authSession = await this.authGateway.signIn("GOOGLE");
    await this.enterGame(authSession);
  };

  private async enterGame(authSession: AuthSession): Promise<void> {
    if (!this.storage) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
    this.session = { playerId: authSession.playerId };
    await initializeProgressStore(new LocalGameDataStore(this.storage, this.session.playerId));
    this.mount(this.initialStartScene);
  }

  private handleDevShortcut = (event: KeyboardEvent): void => {
    if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || event.repeat) return;

    const screens: Record<string, () => void> = {
      Digit1: this.showGameStart,
      Digit2: this.showGroups,
    };
    const showScreen = screens[event.code];
    if (!showScreen) return;

    event.preventDefault();
    showScreen();
  };

  private async show(scene: { view: HTMLElement; dispose(): void }): Promise<void> {
    await this.preloadPromise;
    this.mount(scene);
  }

  private mount(scene: { view: HTMLElement; dispose(): void }): void {
    this.disposeScene?.();
    this.disposeScene = scene.dispose;
    this.root.replaceChildren();
    const frame = document.createElement("div");
    frame.className = "game-frame";
    frame.append(scene.view);
    this.frame = frame;
    this.root.append(frame);
  }

  private showOverlay = (scene: { view: HTMLElement; dispose(): void }): Promise<void> =>
    (this.preloadPromise ?? Promise.resolve()).then(() => {
      const previousDispose = this.disposeScene;
      this.disposeScene = () => {
        scene.dispose();
        previousDispose?.();
      };
      const overlay = document.createElement("div");
      overlay.className = "game-overlay";
      overlay.append(scene.view);
      this.frame?.append(overlay);
    });

  showGameStart = (): void => {
    this.show(createStartScene(this.showGroups, true));
  };

  showGroups = (): void => {
    this.showChapter(0);
  };

  private showChapter = (chapterIndex: number): Promise<void> =>
    this.show(createChapterScene(chapterIndex, this.showStageSelect));
  private showStageSelect = (chapterIndex: number): Promise<void> =>
    this.show(
      createStageSelectScene(
        chapterIndex,
        (stageIndex) => this.showGame({ chapterIndex, stageIndex }),
        () => this.showChapter(chapterIndex),
      ),
    );
  private showGame = (selection: PlaySelection): Promise<void> =>
    this.show(createGameScene(selection, () => this.showClear(selection)));
  private showClear = async (selection: PlaySelection): Promise<void> => {
    try {
      await progressStore.markCleared(selection.chapterIndex, selection.stageIndex);
      await this.showOverlay(
        createClearScene(
          () => this.showGame(nextSelection(selection)),
          () => this.showGame(selection),
          this.showGameStart,
        ),
      );
    } catch {
      window.alert("진행 상태를 저장하지 못했습니다. 브라우저 저장소를 확인해 주세요.");
    }
  };
}
