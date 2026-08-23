import { stageSelectAssets } from "@/src/game/assets";

export function createBackButton(
  label: string,
  onClick: () => void,
  className: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  button.style.backgroundImage = `url(${stageSelectAssets.backFrame})`;
  const icon = document.createElement("img");
  icon.src = stageSelectAssets.arrowBack;
  icon.alt = "";
  button.append(icon);
  button.addEventListener("click", onClick);
  return button;
}
