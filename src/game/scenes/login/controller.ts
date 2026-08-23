import styles from "@/src/game/scenes/login/scene.module.css";

export function createLoginScene(
  onSignIn: () => Promise<void>,
  initialError?: string,
): { view: HTMLElement; dispose(): void } {
  const root = document.createElement("main");
  root.className = styles.root;

  const orbit = document.createElement("div");
  orbit.className = styles.orbit;
  orbit.setAttribute("aria-hidden", "true");

  const panel = document.createElement("section");
  panel.className = styles.panel;
  panel.setAttribute("aria-labelledby", "login-title");

  const eyebrow = document.createElement("p");
  eyebrow.className = styles.eyebrow;
  eyebrow.textContent = "LOCAL PLAYER ACCESS";

  const title = document.createElement("h1");
  title.id = "login-title";
  title.className = styles.title;
  title.textContent = "MEOW BEYOND!";

  const subtitle = document.createElement("p");
  subtitle.className = styles.subtitle;
  subtitle.textContent = "이 브라우저에 저장된 플레이어로 시작합니다.";

  const button = document.createElement("button");
  button.className = styles.button;
  button.type = "button";
  button.setAttribute("aria-describedby", "demo-login-notice");

  const googleMark = document.createElement("span");
  googleMark.className = styles.googleMark;
  googleMark.textContent = "G";
  googleMark.setAttribute("aria-hidden", "true");

  const buttonLabel = document.createElement("span");
  buttonLabel.textContent = "Google로 계속하기";
  button.append(googleMark, buttonLabel);

  const notice = document.createElement("p");
  notice.id = "demo-login-notice";
  notice.className = styles.notice;
  notice.innerHTML = "<strong>데모 로그인입니다.</strong><span>실제 Google 계정과 연결되지 않습니다.</span>";

  const error = document.createElement("p");
  error.className = styles.error;
  error.setAttribute("role", "alert");
  error.textContent = initialError ?? "";
  error.hidden = !initialError;

  panel.append(eyebrow, title, subtitle, button, notice, error);
  root.append(orbit, panel);

  const handleSignIn = async (): Promise<void> => {
    button.disabled = true;
    buttonLabel.textContent = "플레이어를 불러오는 중";
    error.hidden = true;
    try {
      await onSignIn();
    } catch {
      error.textContent = "로그인 정보를 저장하지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.";
      error.hidden = false;
      button.disabled = false;
      buttonLabel.textContent = "Google로 계속하기";
    }
  };

  button.addEventListener("click", handleSignIn);
  return {
    view: root,
    dispose: () => button.removeEventListener("click", handleSignIn),
  };
}
