import { backgroundUrl, stageSelectAssets, startAssets } from "@/src/game/assets";
import { createPlateButton } from "@/src/game/components/PlateButton";
import { createBackgroundStars } from "@/src/game/scenes/shared/backgroundStars";
import styles from "@/src/game/scenes/start/scene.module.css";

function createGoogleMark(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add(styles.googleMark);
  svg.setAttribute("viewBox", "0 0 18 18");
  svg.setAttribute("aria-hidden", "true");
  const paths = [
    [
      "#4285f4",
      "M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.798 2.717v2.258h2.91c1.704-1.568 2.684-3.878 2.684-6.615Z",
    ],
    [
      "#34a853",
      "M9 18c2.43 0 4.467-.806 5.956-2.18l-2.91-2.258c-.806.54-1.835.858-3.046.858-2.344 0-4.328-1.584-5.037-3.71H.956v2.332A9 9 0 0 0 9 18Z",
    ],
    [
      "#fbbc05",
      "M3.963 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.281-1.71V4.958H.956A9 9 0 0 0 0 9c0 1.45.347 2.824.956 4.042l3.007-2.332Z",
    ],
    [
      "#ea4335",
      "M9 3.58c1.321 0 2.507.454 3.441 1.346l2.581-2.581C13.463.892 11.426 0 9 0A9 9 0 0 0 .956 4.958L3.963 7.29C4.672 5.164 6.656 3.58 9 3.58Z",
    ],
  ] as const;
  paths.forEach(([fill, d]) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", fill);
    path.setAttribute("d", d);
    svg.append(path);
  });
  return svg;
}

export function createStartView(
  onStart: () => void,
  initiallyAuthenticated = false,
): {
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
  let googleMark: SVGSVGElement | undefined;
  const notice = document.createElement("div");
  notice.className = styles.notice;
  const noticeBubble = document.createElement("img");
  noticeBubble.className = styles.noticeBubble;
  noticeBubble.src = stageSelectAssets.bubbleNext;
  noticeBubble.alt = "";
  const noticeLabel = document.createElement("span");
  noticeLabel.className = styles.noticeLabel;
  noticeLabel.textContent = "DEMO / FAKE";
  notice.append(noticeBubble, noticeLabel);
  const error = document.createElement("p");
  error.className = styles.error;
  error.setAttribute("role", "alert");

  const renderAction = (): void => {
    if (!ready) return;
    if (!start) {
      start = createPlateButton("START", onStart);
      start.classList.add(styles.start);
      googleMark = createGoogleMark();
      start.append(googleMark);
      area.replaceChildren(start, notice, error);
    }
    googleMark!.style.display = authenticated ? "none" : "";
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
