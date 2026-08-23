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
import { attachClickStars } from "@/src/game/scenes/shared/backgroundStars";
import { createStageSelectScene } from "@/src/game/scenes/stage-select/controller";
import { createStartScene, type StartScene } from "@/src/game/scenes/start/controller";
import { nextSelection, type PlaySelection } from "@/src/game/stages";
import { initializeProgressStore, progressStore } from "@/src/game/store/progressStore";
import { playSfx, preloadSfx } from "@/src/game/sfx";

export class GameApp {
  private disposeScene?: () => void;
  private frame?: HTMLElement;
  private preloadPromise?: Promise<void>;
  private authGateway?: AuthGateway;
  private storage?: BrowserStorage;
  private readonly initialStartScene: StartScene;
  private session?: GameSession;

  constructor(private readonly root: HTMLElement) {
    this.root.addEventListener("dragstart", (event) => event.preventDefault());
    this.root.addEventListener("click", this.handleButtonSound);
    preloadSfx();
    if (import.meta.env.DEV) document.addEventListener("keydown", this.handleDevShortcut);
    this.initialStartScene = this.createIntroScene(false);
    this.mount(this.initialStartScene);
    this.preloadPromise = preloadAssets(allGameAssetUrls(), this.initialStartScene.updateLoading);
    try {
      this.storage = window.localStorage;
      this.authGateway = new LocalAuthAdapter(this.storage);
    } catch {
      this.initialStartScene.setError(
        "브라우저 저장소에 접근할 수 없습니다. 저장소 설정을 확인해 주세요.",
      );
      return;
    }
    void this.restoreSession();
  }

  private handleButtonSound = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>("button");
    if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;
    playSfx(button.dataset.sfx === "button" ? "button" : "click");
  };

  private createIntroScene(loaded: boolean): StartScene {
    let scene: StartScene;
    scene = createStartScene(() => this.startFromIntro(scene), loaded, Boolean(this.session));
    return scene;
  }

  private restoreSession = async (): Promise<void> => {
    try {
      if (!this.authGateway) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
      const authSession = await this.authGateway.restore();
      if (authSession === null) return;
      await this.establishSession(authSession);
      this.initialStartScene.setAuthenticated(true);
    } catch {
      this.initialStartScene.setError(
        "저장된 로그인 정보를 읽지 못했습니다. 브라우저 저장소를 확인해 주세요.",
      );
    }
  };

  private async establishSession(authSession: AuthSession): Promise<void> {
    if (!this.storage) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
    const session: GameSession = { playerId: authSession.playerId };
    await initializeProgressStore(new LocalGameDataStore(this.storage, session.playerId));
    this.session = session;
  }

  private startFromIntro = async (scene: StartScene): Promise<void> => {
    if (this.session) {
      this.showGroups();
      return;
    }

    scene.setPending(true);
    scene.setError();
    try {
      if (!this.authGateway) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
      await this.establishSession(await this.authGateway.signIn("GOOGLE"));
      scene.setAuthenticated(true);
      this.showGroups();
    } catch {
      scene.setError("로그인 정보를 저장하지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.");
    } finally {
      scene.setPending(false);
    }
  };

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
    attachClickStars(frame);
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
    this.show(this.createIntroScene(true));
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
