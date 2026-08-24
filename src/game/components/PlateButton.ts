import { plateButtonUrl } from "@/src/game/assets";

export function createPlateButton(
  label: string,
  onClick: () => void,
  className = "plate-button",
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.buttonStyle = "plate";
  button.dataset.sfx = "button";
  button.style.fontFamily = "'온글잎 박다현체', monospace";
  const shadow = document.createElement("span");
  shadow.className = "plate-button-shadow";
  shadow.setAttribute("aria-hidden", "true");
  shadow.style.backgroundImage = `url(${plateButtonUrl})`;
  const art = document.createElement("span");
  art.className = "plate-button-art";
  art.setAttribute("aria-hidden", "true");
  art.style.backgroundImage = `url(${plateButtonUrl})`;
  const text = document.createElement("span");
  text.textContent = label;
  button.append(shadow, art, text);
  button.addEventListener("click", onClick);
  return button;
}
