import { plateButtonUrl } from "@/src/game/assets";

export function createPlateButton(
  label: string,
  onClick: () => void,
  className = "plate-button",
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.sfx = "button";
  button.style.fontFamily = "'온글잎 박다현체', monospace";
  button.style.backgroundImage = `url(${plateButtonUrl})`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}
