import { gameAssetUrlGroups } from "@/src/game/assets";
import {
  type BrowserStorage,
  LocalAuthAdapter,
  type AuthGateway,
  type AuthSession,
  type GameSession,
} from "@/src/game/auth";
import {
  bgmForChapter,
  type BgmTrack,
  preloadBgm,
  preloadRemainingBgm,
  resumeBgm,
  setBgm,
} from "@/src/game/bgm";
import {
  dailyChallenge,
  FakeChallengeServer,
  type ChallengeGateway,
  type DailyChallenge,
} from "@/src/game/challenge";
import { FakeGameDataServer } from "@/src/game/dataStore";
import { preloadAssets } from "@/src/game/preload";
import { createChapterScene } from "@/src/game/scenes/chapter/controller";
import {
  createChallengeResultScene,
  type ChallengeResultScene,
} from "@/src/game/scenes/challenge-result/controller";
import { createClearScene } from "@/src/game/scenes/clear/controller";
import { createDemoEndScene } from "@/src/game/scenes/demo-end/controller";
import {
  createChallengeGameScene,
  createGameScene,
  createTutorialGameScene,
  type GameScene,
} from "@/src/game/scenes/game/controller";
import { attachClickStars } from "@/src/game/scenes/shared/backgroundStars";
import { SceneTransition } from "@/src/game/components/SceneTransition";
import { createStageSelectScene } from "@/src/game/scenes/stage-select/controller";
import { createStartScene, type StartScene } from "@/src/game/scenes/start/controller";
import { createTutorialScene } from "@/src/game/scenes/tutorial/controller";
import { chapters, isDemoEndStage, nextSelection, type PlaySelection } from "@/src/game/stages";
import { initializeProgressStore, progressStore } from "@/src/game/store/progressStore";
import { playSfx, preloadSfx } from "@/src/game/sfx";
import {
  entryTutorialKey,
  entryTutorials,
  firstPlayTutorials,
} from "@/src/game/tutorial/definitions";
import type { TutorialDefinition } from "@/src/game/tutorial/rules";

interface Scene {
  view: HTMLElement;
  ready?: Promise<void>;
  activate?(): void;
  dispose(): void;
}

export class GameApp {
  private disposeScene?: () => void;
  private frame?: HTMLElement;
  private preloadPromise?: Promise<void>;
  private transitionId = 0;
  private authGateway?: AuthGateway;
  private challengeGateway?: ChallengeGateway;
  private storage?: BrowserStorage;
  private readonly initialStartScene: StartScene;
  private readonly transition: SceneTransition;
  private session?: GameSession;

  private blockTransitionKeydown = (event: KeyboardEvent): void => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  constructor(private readonly root: HTMLElement) {
    this.root.addEventListener("dragstart", (event) => event.preventDefault());
    this.root.addEventListener("click", this.handleButtonSound);
    preloadBgm();
    preloadSfx();
    // TODO: 배포 확인이 끝나면 개발 환경에서만 단축키를 등록하도록 되돌립니다.
    // if (import.meta.env.DEV)
    document.addEventListener("keydown", this.handleDevShortcut);
    this.transition = new SceneTransition();
    this.initialStartScene = this.createIntroScene(false);
    this.mount(this.initialStartScene);
    setBgm("entire");
    const [introAssets, ...laterAssets] = gameAssetUrlGroups();
    this.preloadPromise = preloadAssets(
      [[() => document.fonts.load('1em "온글잎 박다현체"'), ...introAssets!], ...laterAssets],
      this.initialStartScene.updateLoading,
    );
    void this.preloadPromise.then(preloadRemainingBgm);
    try {
      this.storage = window.localStorage;
      this.authGateway = new LocalAuthAdapter(this.storage);
      this.challengeGateway = new FakeChallengeServer(this.storage);
    } catch {
      this.initialStartScene.setError(
        "브라우저 저장소에 접근할 수 없습니다. 저장소 설정을 확인해 주세요.",
      );
      return;
    }
    void this.restoreSession();
  }

  private handleButtonSound = (event: MouseEvent): void => {
    resumeBgm();
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
    const session: GameSession = {
      playerId: authSession.playerId,
      displayName: authSession.displayName,
    };
    await initializeProgressStore(new FakeGameDataServer(this.storage, session.playerId));
    this.session = session;
  }

  private startFromIntro = async (scene: StartScene): Promise<void> => {
    if (this.session) {
      this.showTutorialOrGroups();
      return;
    }

    scene.setPending(true);
    scene.setError();
    try {
      if (!this.authGateway) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
      await this.establishSession(await this.authGateway.signIn("GOOGLE"));
      scene.setAuthenticated(true);
      this.showTutorialOrGroups();
    } catch {
      scene.setError("로그인 정보를 저장하지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.");
    } finally {
      scene.setPending(false);
    }
  };

  private showTutorialOrGroups(): void {
    if (progressStore.isTutorialCompleted()) {
      this.showGroups();
      return;
    }
    const stageIndex = progressStore.tutorialStageIndex();
    if (stageIndex > 0) {
      this.showPlayTutorial(stageIndex);
      return;
    }
    void this.show(createTutorialScene(this.showPlayTutorial));
  }

  private showPlayTutorial = (stageIndex = 0): void => {
    const tutorial = firstPlayTutorials[stageIndex];
    if (!tutorial) {
      void this.completeTutorial();
      return;
    }
    void this.show(
      createTutorialGameScene(
        tutorial,
        () => void this.completeTutorialStage(stageIndex),
        () => void this.show(this.createIntroScene(true), true),
        () => void this.completeTutorial(),
      ),
      true,
      "tutorial",
    );
  };

  private completeTutorialStage = async (stageIndex: number): Promise<void> => {
    try {
      await progressStore.markTutorialStageCompleted(stageIndex);
    } catch {
      window.alert("튜토리얼 진행 상태를 저장하지 못했습니다. 다음 실행에서 다시 표시됩니다.");
    }
    this.showPlayTutorial(stageIndex + 1);
  };

  private completeTutorial = async (): Promise<void> => {
    try {
      await progressStore.markTutorialCompleted();
    } catch {
      window.alert("튜토리얼 완료 상태를 저장하지 못했습니다. 다음 실행에서 다시 표시됩니다.");
    }
    this.showGroups(true);
  };

  private handleDevShortcut = (event: KeyboardEvent): void => {
    if (
      !event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.shiftKey ||
      event.repeat ||
      event.code !== "Digit0"
    )
      return;

    event.preventDefault();
    void this.resetAccountForTutorial();
  };

  private resetAccountForTutorial = async (): Promise<void> => {
    try {
      if (!this.session) {
        if (!this.authGateway) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
        await this.establishSession(await this.authGateway.signIn("GOOGLE"));
      }
      await progressStore.reset();
      this.showTutorialOrGroups();
    } catch {
      window.alert("계정 기록을 초기화하지 못했습니다. 브라우저 저장소를 확인해 주세요.");
    }
  };

  private async show(scene: Scene, wave = false, bgm: BgmTrack = "entire"): Promise<void> {
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
      setBgm(bgm);
      if (wave) await this.playWaveTransition("revealing");
      this.releaseTransitionInput();
    } catch (error) {
      scene.dispose();
      if (transitionId === this.transitionId) {
        this.transition.reset();
        this.releaseTransitionInput(previousFrame);
      }
      throw error;
    }
  }

  private playWaveTransition(phase: "covering" | "revealing"): Promise<void> {
    if (phase === "covering") playSfx("swoosh");
    return this.transition.play(phase);
  }

  private blockTransitionInput(frame?: HTMLElement): void {
    if (frame) frame.inert = true;
    window.addEventListener("keydown", this.blockTransitionKeydown, true);
  }

  private releaseTransitionInput(frame?: HTMLElement): void {
    if (frame) frame.inert = false;
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
    else this.root.append(frame, this.transition.element);
    this.frame = frame;
    scene.activate?.();
  }

  private showOverlay = async (scene: Scene, bgm: BgmTrack = "entire"): Promise<void> => {
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
      const underlay = frame?.firstElementChild;
      if (underlay instanceof HTMLElement) underlay.inert = true;
      const overlay = document.createElement("div");
      overlay.className = "game-overlay";
      overlay.append(scene.view);
      frame?.append(overlay);
      scene.activate?.();
      setBgm(bgm);
      this.releaseTransitionInput(frame);
    } catch (error) {
      scene.dispose();
      if (transitionId === this.transitionId) {
        const underlay = frame?.firstElementChild;
        if (underlay instanceof HTMLElement) underlay.inert = false;
        this.releaseTransitionInput(frame);
      }
      throw error;
    }
  };

  showGroups = (wave = false): void => {
    void this.showChapter(0, wave);
  };

  private showChapter = (selectionIndex: number, wave = false): Promise<void> =>
    this.show(
      createChapterScene(
        selectionIndex,
        (selectedChapter) => this.showStageSelect(selectedChapter, true),
        this.showChallenge,
        () => void this.show(this.createIntroScene(true)),
      ),
      wave,
    );
  private showStageSelect = (chapterIndex: number, wave = false): Promise<void> =>
    this.show(
      createStageSelectScene(
        chapterIndex,
        (stageIndex) => void this.showEntryTutorialOrGame({ chapterIndex, stageIndex }),
        () => this.showChapter(chapterIndex + 1),
      ),
      wave,
      bgmForChapter(chapters[chapterIndex]!.sign),
    );
  private showEntryTutorialOrGame(selection: PlaySelection): Promise<void> {
    const tutorials =
      entryTutorials[entryTutorialKey(selection.chapterIndex, selection.stageIndex)];
    if (
      !tutorials ||
      progressStore.isEntryTutorialCompleted(selection.chapterIndex, selection.stageIndex)
    )
      return this.showGame(selection, true);
    return this.showEntryTutorialStage(selection, tutorials, 0);
  }
  private showEntryTutorialStage = (
    selection: PlaySelection,
    tutorials: readonly TutorialDefinition[],
    stageIndex: number,
  ): Promise<void> => {
    const tutorial = tutorials[stageIndex];
    if (!tutorial) {
      void this.completeEntryTutorial(selection);
      return Promise.resolve();
    }
    return this.show(
      createTutorialGameScene(
        tutorial,
        () => this.showEntryTutorialStage(selection, tutorials, stageIndex + 1),
        () => void this.showStageSelect(selection.chapterIndex),
        () => void this.completeEntryTutorial(selection),
      ),
      true,
      "tutorial",
    );
  };
  private completeEntryTutorial = async (selection: PlaySelection): Promise<void> => {
    try {
      await progressStore.markEntryTutorialCompleted(selection.chapterIndex, selection.stageIndex);
    } catch {
      window.alert("튜토리얼 진행 상태를 저장하지 못했습니다. 다음 실행에서 다시 표시됩니다.");
    }
    void this.showGame(selection, true);
  };
  private prepareGame(selection: PlaySelection): GameScene {
    if (isDemoEndStage(selection))
      return createDemoEndScene(() => this.showStageSelect(selection.chapterIndex));
    return createGameScene(
      selection,
      () => this.showClear(selection),
      () => this.showStageSelect(selection.chapterIndex),
    );
  }

  private showGame = (selection: PlaySelection, wave = false): Promise<void> =>
    this.show(
      this.prepareGame(selection),
      wave,
      bgmForChapter(chapters[selection.chapterIndex]!.sign),
    );
  private showChallenge = (): void => {
    const challenge = dailyChallenge();
    const result = createChallengeResultScene(challenge.date, this.session?.playerId ?? "", () =>
      this.showGroups(true),
    );
    void this.show(
      createChallengeGameScene(
        challenge.mapUrl,
        (durationMs) => void this.showChallengeResult(result, challenge, durationMs),
        () => this.showChapter(0),
      ),
      true,
    );
  };
  private showChallengeResult = async (
    result: ChallengeResultScene,
    challenge: DailyChallenge,
    durationMs: number,
  ): Promise<void> => {
    let leaderboard;
    try {
      if (!this.challengeGateway || !this.session)
        throw new Error("챌린지 세션을 사용할 수 없습니다.");
      leaderboard = await this.challengeGateway.submitResult(
        challenge.id,
        this.session,
        durationMs,
      );
    } catch {
      leaderboard = undefined;
    }
    result.setLeaderboard(leaderboard);
    await this.showOverlay(result);
  };
  private showClear = async (selection: PlaySelection): Promise<void> => {
    const next = nextSelection(selection);
    try {
      await progressStore.markCleared(selection.chapterIndex, selection.stageIndex);
      const clear = createClearScene(
        () => void this.showEntryTutorialOrGame(next),
        () => void this.showGame(selection),
        () => void this.showStageSelect(selection.chapterIndex),
      );
      await this.showOverlay(clear, bgmForChapter(chapters[selection.chapterIndex]!.sign));
    } catch {
      window.alert("진행 상태를 저장하지 못했습니다. 브라우저 저장소를 확인해 주세요.");
    }
  };
}
