import { stageSelectAssets } from "@/src/game/assets";

export function createBackButton(
  label: string,
  onClick: () => void,
  className: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.buttonStyle = "back";
  button.setAttribute("aria-label", label);
  const glow = document.createElement("span");
  glow.className = "back-button-glow";
  glow.setAttribute("aria-hidden", "true");
  glow.style.backgroundImage = `url(${stageSelectAssets.backFrame})`;
  const art = document.createElement("span");
  art.className = "back-button-art";
  art.setAttribute("aria-hidden", "true");
  art.style.backgroundImage = `url(${stageSelectAssets.backFrame})`;
  const icon = document.createElement("img");
  icon.src = stageSelectAssets.arrowBack;
  icon.alt = "";
  button.append(glow, art, icon);
  button.addEventListener("click", onClick);
  return button;
}
