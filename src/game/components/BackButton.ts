import { gameActionAssets } from "@/src/game/assets";
import styles from "@/src/game/components/BackButton.module.css";

export function createBackButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = styles.root;
  button.dataset.buttonStyle = "back";
  button.setAttribute("aria-label", label);
  const icon = document.createElement("img");
  icon.src = gameActionAssets.back;
  icon.alt = "";
  button.append(icon);
  button.addEventListener("click", onClick);
  return button;
}
