import { backgroundUrl, startAssets } from "@/src/game/assets";
import { createPlateButton } from "@/src/game/components/PlateButton";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import styles from "@/src/game/scenes/start/scene.module.css";

export function startButtonLabel(authenticated: boolean): "Start" | "Start with Google" {
  return authenticated ? "Start" : "Start with Google";
}

export function createStartView(onStart: () => void, initiallyAuthenticated = false): {
  root: HTMLElement;
  updateLoading(loaded: number, total: number): void;
  setAuthenticated(authenticated: boolean): void;
  setPending(pending: boolean): void;
  setError(message?: string): void;
} {
  const root = document.createElement("main");
  root.className = styles.root;
  root.style.backgroundImage = `url(${backgroundUrl})`;
  const stars = createBackgroundStars();
  const title = document.createElement("img");
  title.className = styles.title;
  title.src = startAssets.title;
  title.alt = "";
  const lunar = document.createElement("img");
  lunar.className = styles.lunar;
  lunar.src = startAssets.lunar;
  lunar.alt = "";
  const mascot = document.createElement("img");
  mascot.className = styles.mascot;
  mascot.src = startAssets.mascots[Math.floor(Math.random() * startAssets.mascots.length)]!;
  mascot.alt = "";
  const area = document.createElement("div");
  area.className = styles.startArea;
  const loading = document.createElement("div");
  loading.className = styles.loading;
  const message = document.createElement("p");
  message.className = styles.message;
  message.textContent = "고양이는 세상을 구할 수 있습니다. 귀여우니까요!.";
  const gauge = document.createElement("progress");
  gauge.className = styles.gauge;
  gauge.setAttribute("aria-label", "게임 자산 로딩 진행률");
  const percentage = document.createElement("output");
  percentage.className = styles.percentage;
  loading.append(message, gauge, percentage);
  area.append(loading);
  root.append(stars, title, lunar, mascot, area);

  let authenticated = initiallyAuthenticated;
  let pending = false;
  let errorMessage: string | undefined;
  let ready = false;
  let start: HTMLButtonElement | undefined;
  const notice = document.createElement("p");
  notice.className = styles.notice;
  notice.textContent = "데모 로그인입니다. 실제 Google 계정과 연결되지 않습니다.";
  const error = document.createElement("p");
  error.className = styles.error;
  error.setAttribute("role", "alert");

  const renderAction = (): void => {
    if (!ready) return;
    if (!start) {
      start = createPlateButton(startButtonLabel(authenticated), onStart);
      start.classList.add(styles.start);
      area.replaceChildren(start, notice, error);
    }
    start.textContent = startButtonLabel(authenticated);
    start.disabled = pending;
    notice.hidden = authenticated;
    error.textContent = errorMessage ?? "";
    error.hidden = !errorMessage;
  };

  const updateLoading = (loaded: number, total: number): void => {
    const complete = loaded >= total;
    const percent = total === 0 ? 100 : Math.round((loaded / total) * 100);
    gauge.max = Math.max(total, 1);
    gauge.value = total === 0 ? 1 : loaded;
    percentage.value = `${percent}%`;
    if (!complete || ready) return;

    ready = true;
    renderAction();
  };

  return {
    root,
    updateLoading,
    setAuthenticated(value) {
      authenticated = value;
      renderAction();
    },
    setPending(value) {
      pending = value;
      renderAction();
    },
    setError(value) {
      errorMessage = value;
      renderAction();
    },
  };
}
