import { clearAssets, decorAssets, gameAssetUrlGroups } from "@/src/game/assets";
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

interface Scene {
  view: HTMLElement;
  ready?: Promise<void>;
  activate?(): void;
  dispose(): void;
}

const svgNamespace = "http://www.w3.org/2000/svg";

function createSceneTransition(): HTMLElement {
  const layer = document.createElement("div");
  layer.className = "scene-transition";
  layer.setAttribute("aria-hidden", "true");
  const band = document.createElement("div");
  band.className = "transition-band";
  const wave = document.createElementNS(svgNamespace, "svg");
  wave.classList.add("transition-wave");
  wave.setAttribute("viewBox", "0 0 2688 1080");
  wave.setAttribute("preserveAspectRatio", "none");
  const shape = document.createElementNS(svgNamespace, "path");
  shape.setAttribute(
    "d",
    "M60 0 C170 120 20 240 130 360 C250 480 80 600 190 720 C310 840 160 960 260 1080 L2640 1080 C2520 970 2670 850 2580 740 C2470 620 2660 510 2520 390 C2420 270 2520 130 2380 0 Z",
  );
  wave.append(shape);
  band.append(wave);

  const meteors = [
    { source: decorAssets.starMedium, x: 90, y: 18, size: 2.5, delay: 120, duration: 720 },
    { source: clearAssets.spark, x: 92, y: 40, size: 2, delay: 80, duration: 760 },
    { source: decorAssets.starLarge, x: 95, y: 65, size: 3, delay: 40, duration: 800 },
    { source: clearAssets.spark, x: 98, y: 86, size: 2.25, delay: 0, duration: 840 },
  ] as const;
  meteors.forEach(({ source, x, y, size, delay, duration }, index) => {
    const meteor = document.createElement("span");
    meteor.className = "transition-meteor";
    meteor.style.setProperty("--meteor-x", `${x}%`);
    meteor.style.setProperty("--meteor-y", `${y}%`);
    meteor.style.setProperty("--meteor-size", `${size}cqw`);
    meteor.style.setProperty("--meteor-delay", `${delay}ms`);
    meteor.style.setProperty("--meteor-duration", `${duration}ms`);
    meteor.style.setProperty("--meteor-color", index % 2 === 0 ? "215 249 255" : "247 211 111");
    const star = document.createElement("img");
    star.src = source;
    star.alt = "";
    meteor.append(star);
    band.append(meteor);
  });
  layer.append(band);
  return layer;
}

export class GameApp {
  private disposeScene?: () => void;
  private frame?: HTMLElement;
  private preloadPromise?: Promise<void>;
  private transitionId = 0;
  private authGateway?: AuthGateway;
  private storage?: BrowserStorage;
  private readonly initialStartScene: StartScene;
  private readonly transitionLayer: HTMLElement;
  private session?: GameSession;

  private blockTransitionKeydown = (event: KeyboardEvent): void => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  constructor(private readonly root: HTMLElement) {
    this.root.addEventListener("dragstart", (event) => event.preventDefault());
    this.root.addEventListener("click", this.handleButtonSound);
    preloadSfx();
    if (import.meta.env.DEV) document.addEventListener("keydown", this.handleDevShortcut);
    this.transitionLayer = createSceneTransition();
    this.initialStartScene = this.createIntroScene(false);
    this.mount(this.initialStartScene);
    const [introAssets, ...laterAssets] = gameAssetUrlGroups();
    this.preloadPromise = preloadAssets(
      [[() => document.fonts.load('1em "온글잎 박다현체"'), ...introAssets!], ...laterAssets],
      this.initialStartScene.updateLoading,
    );
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

  private async show(scene: Scene, wave = false): Promise<void> {
    const transitionId = ++this.transitionId;
    const previousFrame = this.frame;
    this.blockTransitionInput(previousFrame);
    try {
      await Promise.all([
        this.preloadPromise,
        scene.ready,
        ...(wave ? [this.playWaveTransition("covering")] : []),
      ]);
      if (transitionId !== this.transitionId) {
        scene.dispose();
        return;
      }
      this.mount(scene);
      if (wave) await this.playWaveTransition("revealing");
      this.releaseTransitionInput();
    } catch (error) {
      scene.dispose();
      if (transitionId === this.transitionId) {
        this.transitionLayer.className = "scene-transition";
        this.releaseTransitionInput(previousFrame);
      }
      throw error;
    }
  }

  private playWaveTransition(phase: "covering" | "revealing"): Promise<void> {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.transitionLayer.className =
        phase === "covering" ? "scene-transition covered" : "scene-transition";
      return Promise.resolve();
    }
    this.transitionLayer.className = `scene-transition ${phase}`;
    return new Promise((resolve) => {
      const band = this.transitionLayer.querySelector(".transition-band");
      const complete = (event: Event) => {
        if (event.target !== band) return;
        this.transitionLayer.removeEventListener("animationend", complete);
        this.transitionLayer.className =
          phase === "covering" ? "scene-transition covered" : "scene-transition";
        resolve();
      };
      this.transitionLayer.addEventListener("animationend", complete);
    });
  }

  private blockTransitionInput(frame?: HTMLElement): void {
    if (frame) frame.inert = true;
    window.addEventListener("keydown", this.blockTransitionKeydown, true);
  }

  private releaseTransitionInput(frame?: HTMLElement): void {
    if (frame?.isConnected) frame.inert = false;
    window.removeEventListener("keydown", this.blockTransitionKeydown, true);
  }

  private mount(scene: Scene): void {
    this.disposeScene?.();
    this.disposeScene = scene.dispose;
    const frame = document.createElement("div");
    frame.className = "game-frame";
    attachClickStars(frame);
    frame.append(scene.view);
    if (this.frame?.isConnected) this.frame.replaceWith(frame);
    else this.root.append(frame, this.transitionLayer);
    this.frame = frame;
    scene.activate?.();
  }

  private showOverlay = async (scene: Scene): Promise<void> => {
    const transitionId = ++this.transitionId;
    const frame = this.frame;
    this.blockTransitionInput(frame);
    try {
      await this.preloadPromise;
      await scene.ready;
      if (transitionId !== this.transitionId) {
        scene.dispose();
        return;
      }
      const previousDispose = this.disposeScene;
      this.disposeScene = () => {
        scene.dispose();
        previousDispose?.();
      };
      const overlay = document.createElement("div");
      overlay.className = "game-overlay";
      overlay.append(scene.view);
      frame?.append(overlay);
      scene.activate?.();
      this.releaseTransitionInput(frame);
    } catch (error) {
      scene.dispose();
      if (transitionId === this.transitionId) this.releaseTransitionInput(frame);
      throw error;
    }
  };

  showGameStart = (): void => {
    this.show(this.createIntroScene(true));
  };

  showGroups = (): void => {
    this.showChapter(0);
  };

  private showChapter = (chapterIndex: number): Promise<void> =>
    this.show(
      createChapterScene(chapterIndex, (selectedChapter) =>
        this.showStageSelect(selectedChapter, true),
      ),
    );
  private showStageSelect = (chapterIndex: number, wave = false): Promise<void> =>
    this.show(
      createStageSelectScene(
        chapterIndex,
        (stageIndex) => this.showGame({ chapterIndex, stageIndex }, true),
        () => this.showChapter(chapterIndex),
      ),
      wave,
    );
  private prepareGame(selection: PlaySelection): ReturnType<typeof createGameScene> {
    return createGameScene(
      selection,
      () => this.showClear(selection),
      () => this.showStageSelect(selection.chapterIndex),
    );
  }

  private showGame = (selection: PlaySelection, wave = false): Promise<void> =>
    this.show(this.prepareGame(selection), wave);
  private showClear = async (selection: PlaySelection): Promise<void> => {
    const next = nextSelection(selection);
    const preparedNext = this.prepareGame(next);
    let nextClaimed = false;
    let nextDisposed = false;
    const disposeNext = () => {
      if (nextClaimed || nextDisposed) return;
      nextDisposed = true;
      preparedNext.dispose();
    };
    try {
      await progressStore.markCleared(selection.chapterIndex, selection.stageIndex);
      const clear = createClearScene(
        () => {
          nextClaimed = true;
          void this.show(preparedNext);
        },
        () => {
          disposeNext();
          void this.showGame(selection);
        },
        () => {
          disposeNext();
          void this.showStageSelect(selection.chapterIndex);
        },
      );
      await this.showOverlay({
        ...clear,
        dispose: () => {
          clear.dispose();
          disposeNext();
        },
      });
    } catch {
      disposeNext();
      window.alert("진행 상태를 저장하지 못했습니다. 브라우저 저장소를 확인해 주세요.");
    }
  };
}
